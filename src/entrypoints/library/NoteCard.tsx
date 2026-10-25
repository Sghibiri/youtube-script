import { useEffect, useRef, useState } from 'react';
import type { SavedNote } from '@/types';
import { useI18n } from '@/i18n';
import { focusRing, ghostButton } from '@/components/controls';
import { PROVIDER_INFO } from '@/utils/providers';
import { videoTimeUrl, videoUrl } from '@/utils/notes';
import { AnswerBody } from '../youtube-sidebar.content/AnswerPanel';

const dangerButton = `inline-flex h-7 shrink-0 cursor-pointer items-center rounded-md border-none bg-red-700 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

/** One saved note: its video, when and how it was made, and the answer. */
export function NoteCard({
  note,
  onDelete,
}: {
  note: SavedNote;
  /** Resolves false when nothing was deleted */
  onDelete: (note: SavedNote) => Promise<boolean>;
}) {
  const { t, language } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);

  // Keep keyboard focus on the delete controls as they swap
  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
    else if (wasConfirming.current) deleteRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  const date = new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
  }).format(new Date(note.savedAt));
  const meta = [
    note.channel,
    date,
    note.analysis,
    PROVIDER_INFO[note.provider].label,
  ]
    .filter(Boolean)
    .join(' · ');
  const headingId = `note-${note.id}`;

  const confirmDelete = async () => {
    setDeleting(true);
    const deleted = await onDelete(note);
    // A deleted note disappears; otherwise the error shows above the list
    if (!deleted) {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <article
      aria-labelledby={headingId}
      className="border-0 border-b border-solid border-[var(--color-border-primary)] py-5 last:border-b-0"
    >
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1 basis-64">
          <h2
            id={headingId}
            className="m-0 text-[15px] font-semibold leading-snug"
          >
            <a
              href={videoUrl(note.videoId)}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-sm text-[var(--color-text-primary)] no-underline underline-offset-2 hover:underline ${focusRing}`}
            >
              {note.title}
            </a>
          </h2>
          <p className="m-0 mt-1 text-xs text-[var(--color-text-secondary)]">
            {meta}
          </p>
        </div>

        {confirming ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-xs text-[var(--color-text-primary)]">
              {t.deleteConfirm}
            </span>
            <button
              className={dangerButton}
              onClick={() => void confirmDelete()}
              disabled={deleting}
            >
              {t.deleteNote}
            </button>
            <button
              ref={cancelRef}
              className={ghostButton}
              onClick={() => setConfirming(false)}
              disabled={deleting}
            >
              {t.cancel}
            </button>
          </div>
        ) : (
          <button
            ref={deleteRef}
            className={ghostButton}
            onClick={() => setConfirming(true)}
            aria-describedby={headingId}
          >
            {t.deleteNote}
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-3 text-[13px] leading-relaxed">
        <AnswerBody
          nodes={note.nodes}
          maxSeconds={Number.POSITIVE_INFINITY}
          timeHref={(seconds) => videoTimeUrl(note.videoId, seconds)}
        />
      </div>
    </article>
  );
}
