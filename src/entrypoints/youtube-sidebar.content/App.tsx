import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import type { AnswerNode, LLMProvider, TranscriptData } from '@/types';
import { resolveAnswerLanguage, useI18n } from '@/i18n';
import { usePreferences } from '@/hooks/usePreferences';
import { youtubeService } from '@/services/youtubeService';
import { llmService } from '@/services/llmService';
import { LanguageSelect } from '@/components/LanguageSelector';
import { ProviderSelect } from '@/components/ProviderSelect';
import { ChatModeSelect } from '@/components/ChatModeSelect';
import { NoticeBox } from '@/components/Notice';
import { PromptEditor } from '@/components/PromptEditor';
import { BookIcon, CloseIcon, EditIcon } from '@/components/icons';
import { focusRing, ghostButton } from '@/components/controls';
import {
  buildTask,
  getEffectivePrompts,
  getLocalizedPresets,
} from '@/utils/presetPrompts';
import { DEFAULT_PROVIDER, PROVIDER_INFO, isProvider } from '@/utils/providers';
import { updatePreferences } from '@/utils/preferences';
import { answerToText, extractMoments } from '@/utils/answer';
import { MAX_ANALYSIS_CHARS, questionKey } from '@/utils/notes';
import { groupIntoParagraphs, matchesQuery } from '@/utils/transcript';
import { describeSendResult, type SendNotice } from '@/utils/sendNotice';
import appIcon from '@/assets/icons/app-icon.svg';
import { AnswerActions, type SaveState } from './AnswerActions';
import { AnswerView } from './AnswerPanel';
import { TranscriptView, usePlaybackIndex } from './TranscriptView';
import { useAnswer, type AnswerMeta } from './useAnswer';
import { useDockPage } from './useDockPage';
import { useMoments } from './useMoments';

/** The video ID of the current YouTube URL, updated on in-page navigation. */
export interface VideoIdStore {
  getSnapshot: () => string | null;
  subscribe: (listener: () => void) => () => void;
}

type TranscriptState =
  | { status: 'idle' }
  | { status: 'loading'; videoId: string }
  | { status: 'ready'; videoId: string; data: TranscriptData }
  | { status: 'error'; videoId: string };

type Notice = SendNotice;
type Tab = 'answer' | 'transcript';

const NOTICE_MS = 8000;
const COPIED_MS = 2000;

/** A notice that hides itself after a while when it reports success. */
function useNotice() {
  const [notice, setNotice] = useState<Notice | null>(null);
  useEffect(() => {
    if (notice?.kind !== 'success') return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);
  return [notice, setNotice] as const;
}

/** The question as the note's label: one line, at most 200 characters. */
function questionLabel(question: string): string {
  const line = question.replace(/\s+/g, ' ').trim();
  return line.length <= MAX_ANALYSIS_CHARS
    ? line
    : `${line.slice(0, MAX_ANALYSIS_CHARS - 1).trimEnd()}…`;
}

/** Load the transcript once per video, the first time the sidebar is open. */
function useTranscript(videoId: string | null, enabled: boolean) {
  const [state, setState] = useState<TranscriptState>({ status: 'idle' });
  const [attempt, setAttempt] = useState(0);
  const loadedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !videoId) return;
    const key = `${videoId}:${attempt}`;
    if (loadedKey.current === key) return;
    loadedKey.current = key;

    let cancelled = false;
    let finished = false;
    setState({ status: 'loading', videoId });

    youtubeService.fetchTranscript(videoId).then(
      (data) => {
        finished = true;
        if (!cancelled) setState({ status: 'ready', videoId, data });
      },
      () => {
        finished = true;
        // Not logged: this means the video has no captions (common on
        // Shorts), which the sidebar shows. Chrome lists every warning as an
        // extension error. A source that actually broke logs its own warning.
        if (!cancelled) setState({ status: 'error', videoId });
      }
    );

    return () => {
      cancelled = true;
      // Interrupted before it finished: load again next time
      if (!finished) loadedKey.current = null;
    };
  }, [videoId, enabled, attempt]);

  // Ignore results that belong to the previous video
  const current: TranscriptState =
    state.status !== 'idle' && state.videoId === videoId
      ? state
      : {
          status: enabled && videoId ? 'loading' : 'idle',
          videoId: videoId ?? '',
        };

  return { state: current, retry: () => setAttempt((n) => n + 1) };
}

export default function App({ videoIdStore }: { videoIdStore: VideoIdStore }) {
  const {
    t,
    prompts: promptTranslations,
    formatString,
    language: uiLanguage,
  } = useI18n();
  const videoId = useSyncExternalStore(
    videoIdStore.subscribe,
    videoIdStore.getSnapshot
  );
  const preferences = usePreferences();

  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('transcript');
  const [query, setQuery] = useState('');
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  // Above: sending. Below the answer: saving, copying, opening the chat.
  const [notice, setNotice] = useNotice();
  const [answerNotice, setAnswerNotice] = useNotice();
  const [copied, setCopied] = useState<Tab | null>(null);
  const [scrollRequest, setScrollRequest] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  /** The answer as it was when saved; saving again needs a changed answer */
  const [saved, setSaved] = useState<{
    requestId: string;
    nodes: AnswerNode[];
  } | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const answerTabRef = useRef<HTMLButtonElement>(null);
  const transcriptTabRef = useRef<HTMLButtonElement>(null);

  const { state, retry } = useTranscript(videoId, isOpen);
  const data = state.status === 'ready' ? state.data : null;

  const paragraphs = useMemo(
    () => (data ? groupIntoParagraphs(data.segments) : []),
    [data]
  );
  const active = usePlaybackIndex(paragraphs, isOpen && tab === 'transcript');
  // Push YouTube's page aside so the video stays visible next to the sidebar
  const docked = useDockPage(isOpen && videoId !== null);

  const { answer, start: startAnswer, clear: clearAnswer } = useAnswer(videoId);
  const lastSegment = data?.segments.at(-1);
  const videoEnd = lastSegment
    ? lastSegment.start + lastSegment.duration + 5
    : Number.POSITIVE_INFINITY;
  const answerNodes = answer.status === 'none' ? null : answer.nodes;
  const moments = useMemo(
    () => (answerNodes ? extractMoments(answerNodes, videoEnd) : []),
    [answerNodes, videoEnd]
  );
  // Shown on the progress bar even when the sidebar is closed
  useMoments(moments);
  const momentStarts = useMemo(
    () => moments.map((moment) => ({ start: moment.seconds })),
    [moments]
  );
  const playingMoment = usePlaybackIndex(
    momentStarts,
    isOpen && tab === 'answer'
  );
  const playingSeconds = moments[playingMoment]?.seconds ?? null;

  const deferredQuery = useDeferredValue(query);
  const searching = deferredQuery.trim() !== '';
  const visible = useMemo(
    () =>
      paragraphs
        .map((paragraph, index) => ({ paragraph, index }))
        .filter(({ paragraph }) => matchesQuery(paragraph.text, deferredQuery)),
    [paragraphs, deferredQuery]
  );

  const presets = useMemo(
    () =>
      getEffectivePrompts(
        preferences?.customPrompts,
        getLocalizedPresets(t, promptTranslations)
      ),
    [preferences?.customPrompts, t, promptTranslations]
  );
  const provider: LLMProvider = isProvider(preferences?.defaultProvider)
    ? preferences.defaultProvider
    : DEFAULT_PROVIDER;
  const providerLabel = PROVIDER_INFO[provider].label;
  const answerLanguage = resolveAnswerLanguage(
    preferences?.answerLanguage,
    uiLanguage
  );

  // Fresh start for each video
  useEffect(() => {
    setQuery('');
    setNotice(null);
    setTab('transcript');
  }, [videoId, setNotice]);

  // Messages about the previous answer don't apply to a new one
  const answerId = answer.status === 'none' ? null : answer.requestId;
  useEffect(() => {
    setAnswerNotice(null);
  }, [answerId, setAnswerNotice]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (isOpen && !editing) closeRef.current?.focus();
  }, [isOpen, editing]);

  // The toolbar icon opens and closes the sidebar
  useEffect(() => {
    const onMessage = (message: unknown) => {
      if ((message as { type?: unknown } | null)?.type === 'TOGGLE_SIDEBAR') {
        setIsOpen((open) => !open);
      }
    };
    browser.runtime.onMessage.addListener(onMessage);
    // Opened right after the page was reloaded by a toolbar click
    browser.runtime
      .sendMessage({ type: 'SHOULD_OPEN' })
      .then((reply: unknown) => {
        if ((reply as { open?: unknown } | null)?.open === true) {
          setIsOpen(true);
        }
      })
      .catch(() => {
        // Extension reloaded; nothing to do
      });
    return () => browser.runtime.onMessage.removeListener(onMessage);
  }, []);

  if (!videoId) return null;

  const close = () => {
    setIsOpen(false);
    setEditing(false);
    // Return focus to the button that opened the sidebar
    requestAnimationFrame(() => toggleRef.current?.focus());
  };

  const send = async (task: string, shared: boolean, meta: AnswerMeta) => {
    if (!data || sending) return;
    setSending(true);
    setNotice(null);

    const text = llmService.formatPrompt({
      prompt: buildTask(task, promptTranslations, answerLanguage, { shared }),
      transcript: data.transcript,
      videoTitle: data.title,
      videoUrl: data.videoUrl,
    });
    const requestId = crypto.randomUUID();
    const result = await llmService.sendToAI(provider, text, requestId);

    setSending(false);
    if (result.ok && result.watching) {
      // The answer appears here; the AI tab stays in the background
      startAnswer(requestId, provider, data.videoId, meta);
      setTab('answer');
    } else {
      setNotice(describeSendResult(result, t, formatString, providerLabel));
    }
  };

  const runPreset = (presetId: string, task: string, title: string) => {
    void updatePreferences({ defaultPromptId: presetId });
    void send(task, true, { analysisKey: presetId, analysis: title });
  };

  const askQuestion = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    void send(
      formatString(promptTranslations.question, { question: trimmed }),
      false,
      { analysisKey: questionKey(trimmed), analysis: questionLabel(trimmed) }
    );
  };

  const copy = async (what: Tab) => {
    let text = '';
    if (what === 'answer' && answer.status !== 'none') {
      text = answerToText(answer.nodes);
    } else if (what === 'transcript') {
      text = data?.transcript ?? '';
    }
    if (!text) return;
    const ok = await llmService.copyToClipboard(text);
    if (ok) setCopied(what);
    else {
      const show = what === 'answer' ? setAnswerNotice : setNotice;
      show({ kind: 'error', text: t.errorCopy });
    }
  };

  const isSaved =
    saved !== null &&
    answer.status !== 'none' &&
    saved.requestId === answer.requestId &&
    saved.nodes === answer.nodes;

  const saveAnswer = async () => {
    if (answer.status !== 'done' || !data || saving) return;
    const { analysisKey, analysis, requestId, nodes } = answer;
    if (!analysisKey || !analysis || answer.videoId !== data.videoId) return;

    setSaving(true);
    setAnswerNotice(null);
    const result = await llmService.saveNote({
      videoId: data.videoId,
      title: data.title,
      ...(data.channel ? { channel: data.channel } : {}),
      analysisKey,
      analysis,
      provider: answer.provider,
      nodes,
    });
    setSaving(false);

    if (!result.ok) {
      setAnswerNotice({ kind: 'error', text: t.errorSaveNote });
      return;
    }
    setSaved({ requestId, nodes });
    if (result.file === 'pending') {
      setAnswerNotice({ kind: 'info', text: t.notePending });
    } else if (result.file === 'no-folder') {
      setAnswerNotice({ kind: 'info', text: t.noteNoFolder });
    }
  };

  const openLibrary = async () => {
    if (!(await llmService.openLibrary())) {
      setNotice({ kind: 'error', text: t.errorReload });
    }
  };

  const openChat = async () => {
    if (answer.status === 'none') return;
    const focused = await llmService.focusAITab(answer.requestId);
    if (!focused) setAnswerNotice({ kind: 'error', text: t.errorChatClosed });
  };

  const showNow = () => {
    setQuery('');
    setScrollRequest((n) => n + 1);
  };

  const onSidebarKeyDown = (event: KeyboardEvent) => {
    // The prompt editor handles Escape itself (closes the editor only)
    if (event.key === 'Escape' && !editing) close();
  };

  // Arrow keys move between the two tabs (WAI-ARIA tabs pattern)
  const onTabKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next: Tab = tab === 'answer' ? 'transcript' : 'answer';
    setTab(next);
    (next === 'answer' ? answerTabRef : transcriptTabRef).current?.focus();
  };

  if (!isOpen) {
    // A slim handle on the window edge, where the sidebar slides out from
    return (
      <button
        ref={toggleRef}
        className={`fixed right-0 top-[72px] z-toggle flex h-11 w-9 cursor-pointer items-center justify-center rounded-l-lg border border-r-0 border-solid border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-0 shadow-card transition-colors duration-150 hover:bg-[var(--color-bg-tertiary)] ${focusRing}`}
        onClick={() => setIsOpen(true)}
        title={t.sidebarTitle}
        aria-label={t.sidebarTitle}
        aria-expanded={false}
      >
        <img src={appIcon} alt="" className="block h-6 w-6" />
      </button>
    );
  }

  const ready = data !== null;
  const hasAnswer = answer.status !== 'none';
  const busy = answer.status === 'waiting' || answer.status === 'writing';
  const saveState: SaveState = (() => {
    if (answer.status === 'none' || answer.status === 'failed') return 'hidden';
    if (!answer.analysisKey) return 'hidden';
    if (isSaved) return 'saved';
    if (saving) return 'saving';
    return answer.status === 'done' && ready && answer.nodes.length > 0
      ? 'ready'
      : 'waiting';
  })();

  const tabButton = (value: Tab, label: string, pulse = false) => (
    <button
      ref={value === 'answer' ? answerTabRef : transcriptTabRef}
      role="tab"
      id={`yts-tab-${value}`}
      aria-selected={tab === value}
      aria-controls="yts-panel"
      tabIndex={tab === value ? 0 : -1}
      onClick={() => setTab(value)}
      onKeyDown={onTabKeyDown}
      className={`-mb-px inline-flex h-9 cursor-pointer items-center gap-1.5 border-0 border-b-2 border-solid bg-transparent px-1 text-[13px] font-semibold transition-colors ${
        tab === value
          ? 'border-[var(--color-primary)] text-[var(--color-text-primary)]'
          : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
      } ${focusRing}`}
    >
      {label}
      {pulse && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary motion-reduce:animate-none"
        />
      )}
    </button>
  );

  return (
    <aside
      aria-label={t.sidebarTitle}
      onKeyDown={onSidebarKeyDown}
      className={`fixed right-0 top-0 z-sidebar flex h-screen w-[420px] max-w-[90vw] animate-slide-in-right flex-col border-0 border-l border-solid border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] font-sans text-[var(--color-text-primary)] motion-reduce:animate-none ${
        // Beside the page it needs no shadow; on top of it, it does
        docked ? '' : 'shadow-elevated'
      }`}
    >
      {editing ? (
        <PromptEditor
          customPrompts={preferences?.customPrompts ?? {}}
          onSave={(customPrompts) => {
            void updatePreferences({ customPrompts });
            setEditing(false);
          }}
          onClose={() => setEditing(false)}
        />
      ) : (
        <>
          {/* Header: where the answer comes from and in which language */}
          <header className="flex flex-col gap-2 px-4 pb-2.5 pt-3">
            <div className="flex items-center gap-1.5">
              <ProviderSelect value={provider} />
              <LanguageSelect className="w-[8.5rem] shrink-0" />
              <button
                className={`${ghostButton} ml-auto h-8 w-8 justify-center px-0`}
                onClick={() => void openLibrary()}
                aria-label={t.openLibrary}
                title={t.openLibrary}
              >
                <BookIcon />
              </button>
              <button
                className={`${ghostButton} h-8 w-8 justify-center px-0`}
                onClick={() => setEditing(true)}
                aria-label={t.editPrompts}
                title={t.editPrompts}
              >
                <EditIcon />
              </button>
              <button
                ref={closeRef}
                className={`${ghostButton} h-8 w-8 justify-center px-0`}
                onClick={close}
                aria-label={t.close}
                title={t.close}
              >
                <CloseIcon />
              </button>
            </div>
            <ChatModeSelect provider={provider} />
          </header>

          {/* Ask: which AI, one-click analyses, or a free question */}
          <section
            aria-label={t.analysisLabel}
            className="flex flex-col gap-2 px-4 pb-3"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  className={`inline-flex h-8 cursor-pointer items-center rounded-md border border-solid border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-2.5 text-[13px] font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                  disabled={!ready || sending}
                  title={preset.description}
                  onClick={() =>
                    runPreset(preset.id, preset.prompt, preset.title)
                  }
                >
                  {preset.title}
                </button>
              ))}
            </div>

            <form className="flex gap-1.5" onSubmit={askQuestion}>
              <input
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={t.askPlaceholder}
                aria-label={t.askPlaceholder}
                className="h-8 min-w-0 flex-1 rounded-md border border-solid border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-2.5 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                className={`h-8 shrink-0 cursor-pointer rounded-md border-none bg-[var(--color-action)] px-3 text-[13px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                disabled={!ready || sending || question.trim() === ''}
              >
                {sending ? t.working : t.ask}
              </button>
            </form>

            {notice && <NoticeBox kind={notice.kind}>{notice.text}</NoticeBox>}
          </section>

          {/* Tabs share one scroll area below */}
          <div className="flex items-center gap-4 border-0 border-b border-solid border-[var(--color-border-primary)] px-4">
            <div role="tablist" className="flex gap-4">
              {tabButton('answer', t.tabAnswer, busy && tab !== 'answer')}
              {tabButton('transcript', t.transcriptTitle)}
            </div>
            <div className="ml-auto flex items-center">
              {tab === 'answer' && hasAnswer && (
                <button
                  className={`${ghostButton} w-7 justify-center px-0`}
                  onClick={clearAnswer}
                  aria-label={t.clearAnswer}
                  title={t.clearAnswer}
                >
                  <CloseIcon />
                </button>
              )}
              {tab === 'transcript' && (
                <>
                  <button
                    className={ghostButton}
                    onClick={showNow}
                    disabled={active < 0}
                  >
                    {t.currentSpot}
                  </button>
                  <button
                    className={ghostButton}
                    onClick={() => void copy('transcript')}
                    disabled={!ready}
                  >
                    {copied === 'transcript'
                      ? t.answerCopied
                      : t.copyTranscript}
                  </button>
                </>
              )}
            </div>
          </div>

          {tab === 'transcript' && ready && (
            <div className="flex items-center gap-2 px-4 pt-2">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
                className="h-8 min-w-0 flex-1 rounded-md border border-solid border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-2.5 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-primary focus:outline-none"
              />
              {searching && (
                <span
                  role="status"
                  className="shrink-0 text-xs text-[var(--color-text-secondary)]"
                >
                  {visible.length > 0
                    ? formatString(t.matchCount, {
                        count: String(visible.length),
                      })
                    : t.noMatches}
                </span>
              )}
            </div>
          )}

          <div
            id="yts-panel"
            role="tabpanel"
            aria-labelledby={`yts-tab-${tab}`}
            tabIndex={0}
            className="scrollbar-thin min-h-0 flex-1 overflow-y-auto focus-visible:outline-none"
          >
            {tab === 'answer' &&
              (answer.status === 'none' ? (
                <p className="m-0 px-4 py-6 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                  {t.answerEmpty}
                </p>
              ) : (
                <AnswerView
                  answer={answer}
                  maxSeconds={videoEnd}
                  momentCount={moments.length}
                  playingSeconds={playingSeconds}
                  onSeek={youtubeService.seekTo}
                />
              ))}

            {tab === 'transcript' && (
              <>
                {state.status === 'loading' && (
                  <p className="m-0 px-4 py-6 text-[13px] text-[var(--color-text-secondary)]">
                    {t.loadingTranscript}
                  </p>
                )}
                {state.status === 'error' && (
                  <div className="flex flex-col items-start gap-2 px-4 py-6 text-[13px]">
                    <p className="m-0 font-semibold text-red-700 dark:text-red-300">
                      {t.errorExtract}
                    </p>
                    <p className="m-0 text-[var(--color-text-secondary)]">
                      {t.noCaptionsHint}
                    </p>
                    <button
                      className={`cursor-pointer rounded-md border border-solid border-[var(--color-border-primary)] bg-transparent px-3 py-1.5 text-[13px] font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] ${focusRing}`}
                      onClick={retry}
                    >
                      {t.retry}
                    </button>
                  </div>
                )}
                {ready && (
                  <TranscriptView
                    visible={visible}
                    query={deferredQuery}
                    active={active}
                    scrollRequest={scrollRequest}
                  />
                )}
              </>
            )}
          </div>

          {tab === 'answer' && hasAnswer && (
            <AnswerActions
              save={saveState}
              onSave={() => void saveAnswer()}
              canCopy={answer.nodes.length > 0}
              copied={copied === 'answer'}
              onCopy={() => void copy('answer')}
              onOpenChat={() => void openChat()}
              notice={answerNotice}
            />
          )}
        </>
      )}
    </aside>
  );
}
