import {
  ANSWER_LANGUAGES,
  VIDEO_LANGUAGE,
  chooseLanguage,
  resolveAnswerLanguage,
  useI18n,
} from '@/i18n';
import { usePreferences } from '@/hooks/usePreferences';
import { SELECT_ARROW, selectBox } from '@/components/controls';

/**
 * The language the AI answers in. English, Italian, French, German and
 * Spanish switch the interface too.
 */
export function LanguageSelect({ className = '' }: { className?: string }) {
  const { t, language } = useI18n();
  const preferences = usePreferences();
  const value = resolveAnswerLanguage(preferences?.answerLanguage, language);

  return (
    <select
      className={`${selectBox} ${className}`}
      style={SELECT_ARROW}
      value={value}
      onChange={(event) => void chooseLanguage(event.target.value)}
      aria-label={t.languageLabel}
      title={t.languageLabel}
    >
      {ANSWER_LANGUAGES.map((option) => (
        <option key={option.code} value={option.code}>
          {option.name}
        </option>
      ))}
      <option value={VIDEO_LANGUAGE}>{t.sameAsVideo}</option>
    </select>
  );
}
