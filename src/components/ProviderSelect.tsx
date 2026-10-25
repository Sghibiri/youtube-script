import type { LLMProvider } from '@/types';
import { useI18n } from '@/i18n';
import { LLMIcon } from '@/components/LLMIcon';
import { SELECT_ARROW, selectBox } from '@/components/controls';
import { PROVIDERS, isProvider } from '@/utils/providers';
import { updatePreferences } from '@/utils/preferences';

/** Which AI gets the video: ChatGPT, Claude, Gemini… (saved for next time). */
export function ProviderSelect({
  value,
  className = '',
}: {
  value: LLMProvider;
  className?: string;
}) {
  const { t } = useI18n();

  return (
    <div className={`relative flex min-w-0 items-center ${className}`}>
      <LLMIcon
        provider={value}
        className="pointer-events-none absolute left-2 h-4 w-4"
      />
      <select
        className={`${selectBox} w-full ps-8 font-medium`}
        style={SELECT_ARROW}
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          if (isProvider(next)) {
            void updatePreferences({ defaultProvider: next });
          }
        }}
        aria-label={t.aiHint}
        title={t.aiHint}
      >
        {PROVIDERS.map((info) => (
          <option key={info.value} value={info.value}>
            {info.label}
          </option>
        ))}
      </select>
    </div>
  );
}
