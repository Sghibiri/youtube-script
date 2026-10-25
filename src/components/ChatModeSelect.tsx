import { useId } from 'react';
import type { LLMProvider } from '@/types';
import { useI18n } from '@/i18n';
import { usePreferences } from '@/hooks/usePreferences';
import { PROVIDER_INFO, wantsTemporaryChat } from '@/utils/providers';
import { updatePreferences } from '@/utils/preferences';

const OPTION =
  'relative inline-flex h-7 items-center rounded-sm px-2.5 text-[13px] font-medium text-[var(--color-text-secondary)] transition-colors has-[:checked]:bg-[var(--color-bg-primary)] has-[:checked]:font-semibold has-[:checked]:text-[var(--color-text-primary)] has-[:checked]:shadow-[0_1px_2px_rgba(0,0,0,0.12)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-primary';

/**
 * Open the AI as a temporary chat (the default: kept out of the user's chat
 * history) or a permanent one. Saved for next time, like the AI choice.
 * Providers without a temporary chat link always open a permanent chat.
 */
export function ChatModeSelect({
  provider,
  className = '',
}: {
  provider: LLMProvider;
  className?: string;
}) {
  const { t, formatString } = useI18n();
  const preferences = usePreferences();
  const id = useId();
  const info = PROVIDER_INFO[provider];
  const supported = info.temporaryUrl !== undefined;
  const temporary = supported && wantsTemporaryChat(preferences);
  const names = { provider: info.label };

  const option = (value: boolean, label: string, hint: string) => {
    const disabled = value && !supported;
    return (
      <label
        title={hint}
        className={`${OPTION} ${
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:text-[var(--color-text-primary)]'
        }`}
      >
        {/* Native radios: arrow keys and screen readers work as usual */}
        <input
          type="radio"
          name={id}
          className="sr-only"
          checked={temporary === value}
          disabled={disabled}
          onChange={() => void updatePreferences({ temporaryChat: value })}
        />
        {label}
      </label>
    );
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={`${id}-label`}
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}
    >
      <span
        id={`${id}-label`}
        className="text-xs font-medium text-[var(--color-text-secondary)]"
      >
        {t.chatModeLabel}
      </span>
      <div className="inline-flex rounded-md border border-solid border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-0.5">
        {option(
          true,
          t.chatTemporary,
          supported
            ? formatString(t.chatTemporaryHint, names)
            : formatString(t.chatTemporaryUnsupported, names)
        )}
        {option(
          false,
          t.chatPermanent,
          formatString(t.chatPermanentHint, names)
        )}
      </div>
      {!supported && (
        <span className="text-xs text-[var(--color-text-secondary)]">
          {formatString(t.chatTemporaryUnsupported, names)}
        </span>
      )}
    </div>
  );
}
