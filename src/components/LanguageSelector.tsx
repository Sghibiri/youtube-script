import { useI18n, LANGUAGES } from '@/i18n';
import './LanguageSelector.css';

interface LanguageSelectorProps {
  variant?: 'popup' | 'sidebar';
}

export function LanguageSelector({ variant = 'popup' }: LanguageSelectorProps) {
  const { language, setLanguage } = useI18n();

  return (
    <div className={`language-selector language-selector--${variant}`}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          className={`lang-btn ${language === lang.code ? 'lang-btn--active' : ''}`}
          onClick={() => setLanguage(lang.code)}
          title={lang.name}
          aria-label={lang.name}
        >
          <span className="lang-flag">{lang.flag}</span>
        </button>
      ))}
    </div>
  );
}
