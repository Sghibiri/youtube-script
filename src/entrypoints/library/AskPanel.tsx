import { useCallback, useMemo, useState, type FormEvent } from 'react';
import type { LLMProvider, SavedNote } from '@/types';
import { resolveAnswerLanguage, useI18n } from '@/i18n';
import { usePreferences } from '@/hooks/usePreferences';
import { llmService } from '@/services/llmService';
import { ProviderSelect } from '@/components/ProviderSelect';
import { ChatModeSelect } from '@/components/ChatModeSelect';
import { NoticeBox } from '@/components/Notice';
import { CloseIcon } from '@/components/icons';
import { focusRing, ghostButton, primaryButton } from '@/components/controls';
import { buildTask } from '@/utils/presetPrompts';
import { DEFAULT_PROVIDER, PROVIDER_INFO, isProvider } from '@/utils/providers';
import { buildLibraryPrompt, splitCitations } from '@/utils/library';
import { videoTimeUrl, videoUrl } from '@/utils/notes';
import { formatTimestamp } from '@/utils/transcript';
import { describeSendResult, type SendNotice } from '@/utils/sendNotice';
import { AnswerView } from '../youtube-sidebar.content/AnswerPanel';
import { useAnswer } from '../youtube-sidebar.content/useAnswer';

/** useAnswer clears its answer when this changes; the Library has one */
const LIBRARY_ANSWER = 'library';
const CITATION_TITLE_CHARS = 40;

const citeLink = `rounded-sm px-0.5 text-[12px] font-semibold text-[var(--color-link)] no-underline underline-offset-2 hover:underline ${focusRing}`;

function shortTitle(title: string): string {
  return title.length <= CITATION_TITLE_CHARS
    ? title
    : `${title.slice(0, CITATION_TITLE_CHARS - 1).trimEnd()}…`;
}

/**
 * Ask ChatGPT / Claude a question across the notes shown below (newest
 * first, as many as fit). The answer cites notes as [N3 4:05]; those become
 * links to that video at that time.
 */
export function AskPanel({
  notes,
  total,
}: {
  /** The notes the search shows, newest first */
  notes: readonly SavedNote[];
  total: number;
}) {
  const { t, prompts, formatString, language } = useI18n();
  const preferences = usePreferences();
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<SendNotice | null>(null);
  /** The notes sent with the question, in the order the AI numbered them */
  const [asked, setAsked] = useState<readonly SavedNote[]>([]);
  const { answer, start, clear } = useAnswer(LIBRARY_ANSWER);

  const provider: LLMProvider = isProvider(preferences?.defaultProvider)
    ? preferences.defaultProvider
    : DEFAULT_PROVIDER;
  const answerLanguage = resolveAnswerLanguage(
    preferences?.answerLanguage,
    language
  );
  const fitting = useMemo(
    () => buildLibraryPrompt(notes, '').included,
    [notes]
  );

  const splitText = useCallback(
    (text: string) =>
      splitCitations(text, asked.length).map((part, index) => {
        const note = part.kind === 'cite' ? asked[part.note - 1] : undefined;
        if (part.kind === 'text' || !note) return part.text;
        const time =
          part.seconds === undefined ? null : formatTimestamp(part.seconds);
        return (
          <a
            key={index}
            className={citeLink}
            href={
              part.seconds === undefined
                ? videoUrl(note.videoId)
                : videoTimeUrl(note.videoId, part.seconds)
            }
            target="_blank"
            rel="noopener noreferrer"
            title={note.title}
          >
            {time
              ? `${shortTitle(note.title)} · ${time}`
              : shortTitle(note.title)}
          </a>
        );
      }),
    [asked]
  );

  const ask = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || sending) return;

    const task = buildTask(
      formatString(prompts.library, { question: trimmed }),
      prompts,
      answerLanguage,
      { shared: false }
    );
    const { text, included } = buildLibraryPrompt(notes, task);
    if (included === 0) {
      setNotice({ kind: 'error', text: t.askTooLong });
      return;
    }

    setSending(true);
    setNotice(null);
    const requestId = crypto.randomUUID();
    const result = await llmService.sendToAI(provider, text, requestId);
    setSending(false);

    if (result.ok && result.watching) {
      setAsked(notes.slice(0, included));
      start(requestId, provider, LIBRARY_ANSWER);
    } else {
      setNotice(
        describeSendResult(
          result,
          t,
          formatString,
          PROVIDER_INFO[provider].label
        )
      );
    }
  };

  const openChat = async () => {
    if (answer.status === 'none') return;
    if (!(await llmService.focusAITab(answer.requestId))) {
      setNotice({ kind: 'error', text: t.errorChatClosed });
    }
  };

  return (
    <section
      aria-label={t.askLibraryPlaceholder}
      className="flex flex-col gap-2 rounded-lg border border-solid border-[var(--color-border-primary)] p-3"
    >
      <form
        className="flex flex-wrap gap-1.5"
        onSubmit={(event) => void ask(event)}
      >
        <ProviderSelect value={provider} className="w-36 shrink-0" />
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={t.askLibraryPlaceholder}
          aria-label={t.askLibraryPlaceholder}
          className="h-8 min-w-0 flex-1 basis-48 rounded-md border border-solid border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-2.5 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className={primaryButton}
          disabled={sending || question.trim() === '' || notes.length === 0}
        >
          {sending ? t.working : t.ask}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-xs text-[var(--color-text-secondary)]">
          {formatString(t.askSends, {
            count: String(fitting),
            total: String(total),
          })}
        </p>
        <ChatModeSelect provider={provider} />
      </div>

      {notice && <NoticeBox kind={notice.kind}>{notice.text}</NoticeBox>}

      {answer.status !== 'none' && (
        <div className="-mx-3 -mb-3 mt-1 border-0 border-t border-solid border-[var(--color-border-primary)]">
          <div className="flex justify-end gap-1 px-2 pt-2">
            <button className={ghostButton} onClick={() => void openChat()}>
              {t.openChat}
            </button>
            <button
              className={`${ghostButton} w-7 justify-center px-0`}
              onClick={clear}
              aria-label={t.clearAnswer}
              title={t.clearAnswer}
            >
              <CloseIcon />
            </button>
          </div>
          <AnswerView
            answer={answer}
            momentCount={0}
            maxSeconds={-1}
            splitText={splitText}
          />
        </div>
      )}
    </section>
  );
}
