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

  // Load language preference from storage on mount
  useEffect(() => {
    chrome.storage.local.get(['preferences'], (result) => {
      const prefs = result.preferences as { language?: string } | undefined;
      if (prefs?.language && LANGUAGES.some((l) => l.code === prefs.language)) {
        setLanguageState(prefs.language as SupportedLanguage);
      }
    });
  }, []);

  // Save language to storage and update state
  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);

    // Update preferences in storage
    chrome.storage.local.get(['preferences'], (result) => {
      const prefs =
        (result.preferences as Record<string, unknown> | undefined) || {};
      chrome.storage.local.set({
        preferences: { ...prefs, language: lang },
      });
    });
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
