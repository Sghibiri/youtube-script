import { useI18n, LANGUAGES } from '@/i18n';

interface LanguageSelectorProps {
  variant?: 'popup' | 'sidebar';
}

export function LanguageSelector({ variant = 'popup' }: LanguageSelectorProps) {
  const { language, setLanguage } = useI18n();

  return (
    <div
      className={`flex gap-1 justify-center ${
        variant === 'popup' ? 'mb-3' : 'ml-auto'
      }`}
    >
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          className={`
            bg-transparent border-2 border-transparent rounded-md px-1.5 py-1
            cursor-pointer transition-all duration-150 text-lg leading-none
            ${
              language === lang.code
                ? 'opacity-100 bg-primary/15 border-primary dark:bg-primary-light/20 dark:border-primary-light'
                : 'opacity-60 hover:opacity-100 hover:bg-primary/10 dark:hover:bg-primary-light/15'
            }
          `}
          onClick={() => setLanguage(lang.code)}
          title={lang.name}
          aria-label={lang.name}
        >
          <span className="block">{lang.flag}</span>
        </button>
      ))}
    </div>
  );
}
