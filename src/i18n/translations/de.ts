import type { TranslationStrings, PromptTranslations } from '../types';

export const strings: TranslationStrings = {
  // Header
  appTitle: 'YouTube Script',
  appSubtitle: 'Text holen → An AI senden',

  // Guide steps
  step1: 'Video öffnen',
  step2: 'AI wählen',
  step3: 'Los!',

  // Form labels
  aiLabel: 'AI',
  aiHint: 'Senden an',
  analysisLabel: 'Analyse',
  analysisHint: 'Typ',
  chooseAi: 'AI wählen',
  chooseAnalysis: 'Analyse-Typ',

  // Preset titles & descriptions
  summaryTitle: 'Zusammenfassung',
  summaryDesc: 'Hauptpunkte',
  businessTitle: 'Business',
  businessDesc: 'Strategie',
  actionTitle: 'Aktionsplan',
  actionDesc: 'Nächste Schritte',
  learningTitle: 'Lernen',
  learningDesc: 'Kernideen',

  // Buttons
  go: 'Los!',
  working: 'Läuft...',
  customizePrompts: 'Prompts Bearbeiten',
  extractOnly: 'Nur Extrahieren',
  extractAgain: 'Nochmal Extrahieren',
  save: 'Speichern',
  cancel: 'Abbrechen',
  reset: 'Reset',
  resetAll: 'Alles Reset',

  // Dynamic
  quickSendTo: 'Schnell senden an {provider}',
  readyPaste: 'Fertig! Einfügen in {provider}',

  // Sidebar
  sidebarTitle: 'YouTube Transkript',
  sidebarSubtitle: 'Extrahieren & an AI senden',
  quickSendHint: 'Ein Klick: extrahieren + senden',
  clickAiBelow: 'AI anklicken',
  pasteInstruction: 'Wir kopieren Text und öffnen AI. Einfach einfügen!',
  transcriptPreview: 'Vorschau',

  // Prompt Editor
  editPrompts: 'Prompts Bearbeiten',
  customized: 'Bearbeitet',

  // Errors
  errorNoTab: 'Kein Tab',
  errorNotYouTube: 'YouTube Video öffnen',
  errorSelectPrompt: 'Prompt wählen',
  errorGeneric: 'Fehler',
  errorExtract: 'Kann nicht extrahieren',
  errorOpenAi: 'Kann AI nicht öffnen',

  // Footer
  footerNote: 'Funktioniert mit untertitelten Videos',

  // Misc
  or: 'oder',
};

export const prompts: PromptTranslations = {
  summary:
    'Fasse dieses Video in 5-7 Punkten zusammen, fokussiere auf die Hauptideen und praktische Tipps.',
  business:
    'Extrahiere Business-Insights, Markttrends und strategische Möglichkeiten aus diesem Video.',
  actionPlan:
    'Erstelle einen Aktionsplan mit konkreten Schritten, um die Ideen aus diesem Video umzusetzen.',
  learning:
    'Erkläre die Schlüsselkonzepte, Frameworks und Best Practices aus diesem Video.',
};
