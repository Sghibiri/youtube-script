import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnswerFailure, AnswerNode, LLMProvider } from '@/types';
import { parseAnswerUpdate } from '@/utils/answer';

/** The answer to the latest question, read from the ChatGPT / Claude tab. */
export type AnswerState =
  | { status: 'none' }
  | {
      status: 'waiting' | 'writing' | 'done' | 'failed';
      requestId: string;
      provider: LLMProvider;
      videoId: string;
      nodes: AnswerNode[];
      failure?: AnswerFailure;
      /** The AI tab has reported at least once */
      heard: boolean;
      /** What was asked, for saving the answer as a note */
      analysisKey?: string;
      analysis?: string;
    };

export interface AnswerMeta {
  /** Preset id, or the question's key */
  analysisKey: string;
  /** Preset title, or the question */
  analysis: string;
}

// The AI tab reports within seconds once it has sent the prompt. After that
// it times out by itself, so slow (thinking) models are not cut short here.
const FIRST_REPORT_TIMEOUT_MS = 90_000;

export function useAnswer(videoId: string | null) {
  const [answer, setAnswer] = useState<AnswerState>({ status: 'none' });
  const currentId = useRef<string | null>(null);

  useEffect(() => {
    const onMessage = (message: unknown) => {
      const { type, payload } = (message ?? {}) as {
        type?: unknown;
        payload?: unknown;
      };
      if (type !== 'AI_ANSWER') return;

      const update = parseAnswerUpdate(payload);
      if (!update || update.requestId !== currentId.current) return;

      setAnswer((previous) => {
        if (previous.status === 'none') return previous;
        // A failure after part of the answer arrived (e.g. the chat tab was
        // closed): keep what came through as the final answer
        if (update.status === 'failed' && previous.nodes.length > 0) {
          return { ...previous, status: 'done', heard: true };
        }
        // A finished answer only changes if the AI continued writing
        if (previous.status === 'done' && update.nodes.length === 0) {
          return previous;
        }
        // After a failure, only real progress counts (e.g. the user logged
        // in and the prompt was sent after all)
        if (previous.status === 'failed' && update.status === 'failed') {
          return previous;
        }
        return {
          ...previous,
          status:
            update.status === 'sent' || update.status === 'writing'
              ? update.nodes.length > 0
                ? 'writing'
                : 'waiting'
              : update.status,
          nodes: update.nodes.length > 0 ? update.nodes : previous.nodes,
          failure: update.failure,
          heard: true,
        };
      });
    };

    browser.runtime.onMessage.addListener(onMessage);
    return () => browser.runtime.onMessage.removeListener(onMessage);
  }, []);

  // Give up if the AI tab never reports back at all
  const waitingId =
    answer.status === 'waiting' && !answer.heard ? answer.requestId : null;
  useEffect(() => {
    if (!waitingId) return;
    const timer = setTimeout(() => {
      setAnswer((previous) =>
        previous.status === 'waiting' &&
        !previous.heard &&
        previous.requestId === waitingId
          ? { ...previous, status: 'failed', failure: 'no-reply' }
          : previous
      );
    }, FIRST_REPORT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [waitingId]);

  // An answer belongs to one video
  useEffect(() => {
    setAnswer((previous) =>
      previous.status !== 'none' && previous.videoId !== videoId
        ? { status: 'none' }
        : previous
    );
  }, [videoId]);

  const start = useCallback(
    (
      requestId: string,
      provider: LLMProvider,
      forVideoId: string,
      meta?: AnswerMeta
    ) => {
      currentId.current = requestId;
      setAnswer({
        status: 'waiting',
        requestId,
        provider,
        videoId: forVideoId,
        nodes: [],
        heard: false,
        ...meta,
      });
    },
    []
  );

  const clear = useCallback(() => {
    currentId.current = null;
    setAnswer({ status: 'none' });
  }, []);

  return { answer, start, clear };
}
