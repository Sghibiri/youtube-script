import { useI18n } from '@/i18n';
import { NoticeBox } from '@/components/Notice';
import {
  BookmarkIcon,
  CheckIcon,
  CopyIcon,
  ExternalIcon,
} from '@/components/icons';
import { primaryButton, secondaryButton } from '@/components/controls';
import type { SendNotice } from '@/utils/sendNotice';

/**
 * hidden: nothing to save (failed, or not an analysis);
 * waiting: shown but off until the answer is complete
 */
export type SaveState = 'hidden' | 'waiting' | 'ready' | 'saving' | 'saved';

/**
 * Pinned under the answer: Save to Library first, then Copy and Open chat.
 * Messages about these actions show here, next to the button that caused
 * them.
 */
export function AnswerActions({
  save,
  onSave,
  canCopy,
  copied,
  onCopy,
  onOpenChat,
  notice,
}: {
  save: SaveState;
  onSave: () => void;
  canCopy: boolean;
  copied: boolean;
  onCopy: () => void;
  onOpenChat: () => void;
  notice: SendNotice | null;
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-2 border-0 border-t border-solid border-[var(--color-border-primary)] px-4 py-2.5">
      {notice && <NoticeBox kind={notice.kind}>{notice.text}</NoticeBox>}
      <div className="flex flex-wrap items-center gap-1.5">
        {save === 'saved' && (
          <span
            role="status"
            className="inline-flex h-8 items-center gap-1.5 pe-1.5 text-[13px] font-semibold text-green-700 dark:text-green-400"
          >
            <CheckIcon />
            {t.noteSaved}
          </span>
        )}
        {save !== 'hidden' && save !== 'saved' && (
          <button
            className={`${primaryButton} gap-1.5 px-2.5`}
            onClick={onSave}
            disabled={save !== 'ready'}
          >
            <BookmarkIcon />
            {t.saveNote}
          </button>
        )}
        <button
          className={`${secondaryButton} gap-1.5 px-2.5`}
          onClick={onCopy}
          disabled={!canCopy}
        >
          <CopyIcon />
          {copied ? t.answerCopied : t.copyTranscript}
        </button>
        <button
          className={`${secondaryButton} gap-1.5 px-2.5`}
          onClick={onOpenChat}
        >
          <ExternalIcon />
          {t.openChat}
        </button>
      </div>
    </div>
  );
}
