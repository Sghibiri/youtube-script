import type { TranslationStrings, PromptTranslations } from '../types';

export const strings: TranslationStrings = {
  // Header
  appTitle: 'YouTube Script',
  appSubtitle: 'Ottieni testo → Invia a AI',

  // Guide steps
  step1: 'Apri video',
  step2: 'Scegli AI',
  step3: 'Vai!',

  // Form labels
  aiLabel: 'AI',
  aiHint: 'Invia a',
  analysisLabel: 'Analisi',
  analysisHint: 'Tipo',
  chooseAi: 'Scegli AI',
  chooseAnalysis: 'Tipo Analisi',

  // Preset titles & descriptions
  summaryTitle: 'Riassunto',
  summaryDesc: 'Punti chiave',
  businessTitle: 'Business',
  businessDesc: 'Strategia',
  actionTitle: 'Piano Azione',
  actionDesc: 'Cosa fare',
  learningTitle: 'Impara',
  learningDesc: 'Idee principali',

  // Buttons
  go: 'Vai!',
  working: 'Lavoro...',
  customizePrompts: 'Modifica Prompt',
  extractOnly: 'Solo Estrai',
  extractAgain: 'Estrai Ancora',
  save: 'Salva',
  cancel: 'Annulla',
  reset: 'Reset',
  resetAll: 'Reset Tutto',

  // Dynamic
  quickSendTo: 'Invio Rapido a {provider}',
  readyPaste: 'Pronto! Incolla in {provider}',

  // Sidebar
  sidebarTitle: 'Trascrizione YouTube',
  sidebarSubtitle: 'Estrai e invia a AI',
  quickSendHint: 'Un click: estrai + invia',
  clickAiBelow: 'Clicca un AI',
  pasteInstruction: 'Copiamo il testo e apriamo AI. Basta incollare!',
  transcriptPreview: 'Anteprima',

  // Prompt Editor
  editPrompts: 'Modifica Prompt',
  customized: 'Modificato',

  // Errors
  errorNoTab: 'Nessuna scheda',
  errorNotYouTube: 'Apri un video YouTube',
  errorSelectPrompt: 'Seleziona un prompt',
  errorGeneric: 'Errore',
  errorExtract: 'Impossibile estrarre',
  errorOpenAi: 'Impossibile aprire AI',

  // Footer
  footerNote: 'Funziona con video sottotitolati',

  // Misc
  or: 'oppure',
};

export const prompts: PromptTranslations = {
  summary:
    'Riassumi questo video in 5-7 punti, concentrandoti sulle idee principali e i consigli pratici.',
  business:
    'Estrai informazioni di business, tendenze di mercato e opportunità strategiche discusse in questo video.',
  actionPlan:
    "Crea un piano d'azione con passi concreti per implementare le idee di questo video.",
  learning:
    'Spiega i concetti chiave, i framework e le best practice trattate in questo video.',
};
