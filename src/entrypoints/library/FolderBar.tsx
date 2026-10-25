import { useI18n } from '@/i18n';
import type { FolderStatus } from '@/services/notesFolder';
import {
  ghostButton,
  primaryButton,
  secondaryButton,
} from '@/components/controls';

/** Where note files go, and the one action that fixes it if needed. */
export function FolderBar({
  status,
  pending,
  busy,
  onChoose,
  onAllow,
}: {
  status: FolderStatus | null;
  /** Notes not written to the folder yet */
  pending: number;
  busy: boolean;
  onChoose: () => void;
  onAllow: () => void;
}) {
  const { t, formatString } = useI18n();
  if (!status) return null;

  const name = 'name' in status ? status.name : '';
  const text = {
    unsupported: t.folderUnsupported,
    none: t.folderNone,
    'needs-permission': formatString(t.folderNeedsPermission, { name }),
    missing: formatString(t.folderMissing, { name }),
    ready: formatString(t.folderReady, { name }),
  }[status.state];

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs text-[var(--color-text-secondary)]">
      <span className="min-w-0">
        {text}
        {pending > 0 && 'name' in status && (
          <> · {formatString(t.notesPending, { count: String(pending) })}</>
        )}
      </span>
      {status.state === 'needs-permission' && (
        <>
          <button className={primaryButton} onClick={onAllow} disabled={busy}>
            {t.allowFolder}
          </button>
          <button className={ghostButton} onClick={onChoose} disabled={busy}>
            {t.changeFolder}
          </button>
        </>
      )}
      {(status.state === 'none' || status.state === 'missing') && (
        <button className={primaryButton} onClick={onChoose} disabled={busy}>
          {t.chooseFolder}
        </button>
      )}
      {status.state === 'ready' && (
        <button className={secondaryButton} onClick={onChoose} disabled={busy}>
          {t.changeFolder}
        </button>
      )}
    </div>
  );
}
