import type { TranslationStrings, PromptTranslations } from '../types';

export const strings: TranslationStrings = {
  // Header
  appTitle: 'YouTube Script',
  appSubtitle: 'Obtenir texte → Envoyer à AI',

  // Guide steps
  step1: 'Ouvrir vidéo',
  step2: 'Choisir AI',
  step3: 'Go!',

  // Form labels
  aiLabel: 'AI',
  aiHint: 'Envoyer à',
  analysisLabel: 'Analyse',
  analysisHint: 'Type',
  chooseAi: 'Choisir AI',
  chooseAnalysis: "Type d'Analyse",

  // Preset titles & descriptions
  summaryTitle: 'Résumé',
  summaryDesc: 'Points clés',
  businessTitle: 'Business',
  businessDesc: 'Stratégie',
  actionTitle: "Plan d'Action",
  actionDesc: 'Étapes à faire',
  learningTitle: 'Apprendre',
  learningDesc: 'Idées principales',

  // Buttons
  go: 'Go!',
  working: 'En cours...',
  customizePrompts: 'Modifier Prompts',
  extractOnly: 'Extraire Seul',
  extractAgain: 'Extraire Encore',
  save: 'Sauver',
  cancel: 'Annuler',
  reset: 'Reset',
  resetAll: 'Tout Reset',

  // Dynamic
  quickSendTo: 'Envoi Rapide à {provider}',
  readyPaste: 'Prêt! Coller dans {provider}',

  // Sidebar
  sidebarTitle: 'Transcription YouTube',
  sidebarSubtitle: 'Extraire et envoyer à AI',
  quickSendHint: 'Un clic: extraire + envoyer',
  clickAiBelow: 'Cliquer un AI',
  pasteInstruction: "On copie le texte et ouvre l'AI. Collez simplement!",
  transcriptPreview: 'Aperçu',

  // Prompt Editor
  editPrompts: 'Modifier Prompts',
  customized: 'Modifié',

  // Errors
  errorNoTab: 'Pas de tab',
  errorNotYouTube: 'Ouvrir une vidéo YouTube',
  errorSelectPrompt: 'Choisir un prompt',
  errorGeneric: 'Erreur',
  errorExtract: 'Impossible extraire',
  errorOpenAi: "Impossible ouvrir l'AI",

  // Footer
  footerNote: 'Fonctionne avec vidéos sous-titrées',

  // Misc
  or: 'ou',
};

export const prompts: PromptTranslations = {
  summary:
    'Résume cette vidéo en 5-7 points, en te concentrant sur les idées principales et les conseils pratiques.',
  business:
    'Extrait les insights business, tendances du marché et opportunités stratégiques discutées dans cette vidéo.',
  actionPlan:
    "Crée un plan d'action avec des étapes concrètes pour implémenter les idées de cette vidéo.",
  learning:
    'Explique les concepts clés, frameworks et best practices couverts dans cette vidéo.',
};
