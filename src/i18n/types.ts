// i18n type definitions

export type SupportedLanguage = 'en' | 'it' | 'fr' | 'de' | 'es';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  flag: string;
}

export interface TranslationStrings {
  // Header
  appTitle: string;
  appSubtitle: string;

  // Guide steps (simplified)
  step1: string;
  step2: string;
  step3: string;

  // Form labels
  aiLabel: string;
  aiHint: string;
  analysisLabel: string;
  analysisHint: string;
  chooseAi: string;
  chooseAnalysis: string;

  // Preset titles & descriptions
  summaryTitle: string;
  summaryDesc: string;
  businessTitle: string;
  businessDesc: string;
  actionTitle: string;
  actionDesc: string;
  learningTitle: string;
  learningDesc: string;

  // Buttons
  go: string;
  working: string;
  customizePrompts: string;
  extractOnly: string;
  extractAgain: string;
  save: string;
  cancel: string;
  reset: string;
  resetAll: string;

  // Dynamic (use {var} for interpolation)
  quickSendTo: string;
  readyPaste: string;

  // Sidebar
  sidebarTitle: string;
  sidebarSubtitle: string;
  quickSendHint: string;
  clickAiBelow: string;
  pasteInstruction: string;
  transcriptPreview: string;

  // Prompt Editor
  editPrompts: string;
  customized: string;

  // Errors
  errorNoTab: string;
  errorNotYouTube: string;
  errorSelectPrompt: string;
  errorGeneric: string;
  errorExtract: string;
  errorOpenAi: string;

  // Footer
  footerNote: string;

  // Misc
  or: string;
}

// AI Prompts sent to LLMs
export interface PromptTranslations {
  summary: string;
  business: string;
  actionPlan: string;
  learning: string;
}
