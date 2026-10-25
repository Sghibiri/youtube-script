import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import type {
  SupportedLanguage,
  LanguageConfig,
  TranslationStrings,
  PromptTranslations,
} from './types';
import { updatePreferences } from '@/utils/preferences';

// Import all translations statically (bundle size is small)
import { strings as enStrings, prompts as enPrompts } from './translations/en';
import { strings as itStrings, prompts as itPrompts } from './translations/it';
import { strings as frStrings, prompts as frPrompts } from './translations/fr';
import { strings as deStrings, prompts as dePrompts } from './translations/de';
import { strings as esStrings, prompts as esPrompts } from './translations/es';

// Language configurations
export const LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

/** Answer languages: the interface languages plus a few common extras. */
export const ANSWER_LANGUAGES: readonly { code: string; name: string }[] = [
  ...LANGUAGES.map(({ code, name }) => ({ code, name })),
  { code: 'pt', name: 'Português' },
];

/** Answer in whatever language the video is in */
export const VIDEO_LANGUAGE = 'video';

export function isSupportedLanguage(
  value: unknown
): value is SupportedLanguage {
  return LANGUAGES.some((language) => language.code === value);
}

/** The saved answer language, falling back to the interface language. */
export function resolveAnswerLanguage(
  saved: unknown,
  uiLanguage: SupportedLanguage
): string {
  if (saved === VIDEO_LANGUAGE) return VIDEO_LANGUAGE;
  return ANSWER_LANGUAGES.some((language) => language.code === saved)
    ? (saved as string)
    : uiLanguage;
}

/**
 * One setting for both: the answer language, and the interface language
 * when a translation exists for it.
 */
export function chooseLanguage(code: string): Promise<void> {
  return updatePreferences({
    answerLanguage: code,
    ...(isSupportedLanguage(code) ? { language: code } : {}),
  });
}

// All translations map
const TRANSLATIONS: Record<
  SupportedLanguage,
  { strings: TranslationStrings; prompts: PromptTranslations }
> = {
  en: { strings: enStrings, prompts: enPrompts },
  it: { strings: itStrings, prompts: itPrompts },
  fr: { strings: frStrings, prompts: frPrompts },
  de: { strings: deStrings, prompts: dePrompts },
  es: { strings: esStrings, prompts: esPrompts },
};

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationStrings;
  prompts: PromptTranslations;
  formatString: (template: string, vars: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  // Load the saved language, and follow changes made in the popup or sidebar
  useEffect(() => {
    let active = true;
    chrome.storage.local.get(['preferences'], (result) => {
      const prefs = result.preferences as { language?: unknown } | undefined;
      if (active && isSupportedLanguage(prefs?.language)) {
        setLanguageState(prefs.language);
      }
    });

    const onChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area !== 'local' || !changes.preferences) return;
      const prefs = changes.preferences.newValue as
        | { language?: unknown }
        | undefined;
      if (isSupportedLanguage(prefs?.language)) {
        setLanguageState(prefs.language);
      }
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => {
      active = false;
      chrome.storage.onChanged.removeListener(onChanged);
    };
  }, []);

  // The flags set the answer language too, so the two never disagree
  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    void chooseLanguage(lang);
  };

  // String interpolation: "Hello {name}" + {name: "World"} => "Hello World"
  const formatString = (
    template: string,
    vars: Record<string, string>
  ): string => {
    return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`);
  };

  const currentTranslation = TRANSLATIONS[language];

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t: currentTranslation.strings,
        prompts: currentTranslation.prompts,
        formatString,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

// Hook for consuming translations
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Re-export types
export type {
  SupportedLanguage,
  LanguageConfig,
  TranslationStrings,
  PromptTranslations,
};
