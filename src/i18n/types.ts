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

  // Form labels
  aiHint: string;
  /** Temporary (default) or permanent ChatGPT / Claude chats */
  chatModeLabel: string;
  chatTemporary: string;
  chatPermanent: string;
  chatTemporaryHint: string;
  chatPermanentHint: string;
  chatTemporaryUnsupported: string;
  analysisLabel: string;

  // Preset titles & descriptions
  keyMomentsTitle: string;
  keyMomentsDesc: string;
  summaryTitle: string;
  summaryDesc: string;
  validateTitle: string;
  validateDesc: string;
  businessTitle: string;
  businessDesc: string;
  actionTitle: string;
  actionDesc: string;
  learningTitle: string;
  learningDesc: string;

  // Buttons
  working: string;
  save: string;
  cancel: string;
  reset: string;
  resetAll: string;

  // Dynamic (use {var} for interpolation)
  sentAuto: string;

  // Sidebar
  sidebarTitle: string;
  close: string;
  languageLabel: string;
  sameAsVideo: string;
  pasteHint: string;
  askPlaceholder: string;
  ask: string;
  tabAnswer: string;
  answerEmpty: string;
  transcriptTitle: string;
  searchPlaceholder: string;
  matchCount: string;
  noMatches: string;
  currentSpot: string;
  copyTranscript: string;
  loadingTranscript: string;
  noCaptionsHint: string;
  retry: string;
  jumpTo: string;

  // AI answer shown in the sidebar
  answerWaiting: string;
  answerWriting: string;
  answerMoments: string;
  answerFailedComposer: string;
  answerFailedSend: string;
  answerFailedNoReply: string;
  answerCopied: string;
  openChat: string;
  clearAnswer: string;

  // Prompt Editor
  editPrompts: string;
  customized: string;

  // Errors
  /** Toolbar popup outside YouTube videos */
  openVideoHint: string;
  errorGeneric: string;
  errorExtract: string;
  errorOpenAi: string;
  errorReload: string;
  errorCopy: string;
  errorChatClosed: string;

  // Notes and the Library page
  saveNote: string;
  noteSaved: string;
  notePending: string;
  noteNoFolder: string;
  errorSaveNote: string;
  openLibrary: string;
  libraryTitle: string;
  noteCount: string;
  folderReady: string;
  folderNone: string;
  folderNeedsPermission: string;
  folderMissing: string;
  folderUnsupported: string;
  chooseFolder: string;
  changeFolder: string;
  allowFolder: string;
  notesPending: string;
  syncImported: string;
  syncSkipped: string;
  syncFailed: string;
  errorFolder: string;
  searchNotes: string;
  notesEmpty: string;
  askLibraryPlaceholder: string;
  askSends: string;
  askTooLong: string;
  deleteNote: string;
  deleteConfirm: string;
  errorDelete: string;
  openAt: string;

  // Footer
}

// AI Prompts sent to LLMs
export interface PromptTranslations {
  /** Shared answer shape for every analysis: short summary first, then a list */
  format: string;
  /** Must contain {language} */
  answerIn: string;
  answerInVideo: string;
  keyMoments: string;
  summary: string;
  /** Reality check: main claims with a verdict each */
  validate: string;
  business: string;
  actionPlan: string;
  learning: string;
  /** Free question template; must contain {question} */
  question: string;
  /** Question across saved notes; must contain {question} */
  library: string;
}
