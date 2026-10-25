import type { TranslationStrings, PromptTranslations } from '../types';

export const strings: TranslationStrings = {
  // Header
  appTitle: 'YouTube Script',

  // Form labels
  aiHint: 'Send to',
  chatModeLabel: 'Chat',
  chatTemporary: 'Temporary',
  chatPermanent: 'Permanent',
  chatTemporaryHint: 'Not kept in your {provider} history',
  chatPermanentHint: 'Kept in your {provider} history',
  chatTemporaryUnsupported: 'Temporary not supported for {provider}',
  analysisLabel: 'Analysis',

  // Preset titles & descriptions
  keyMomentsTitle: 'Key moments',
  keyMomentsDesc: 'Timeline',
  summaryTitle: 'Summary',
  summaryDesc: 'Key points',
  validateTitle: 'Validate',
  validateDesc: 'Fact-check the claims',
  businessTitle: 'Business',
  businessDesc: 'Strategy tips',
  actionTitle: 'Action Plan',
  actionDesc: 'Steps to do',
  learningTitle: 'Learn',
  learningDesc: 'Main ideas',

  // Buttons
  working: 'Working...',
  save: 'Save',
  cancel: 'Cancel',
  reset: 'Reset',
  resetAll: 'Reset All',

  // Dynamic
  sentAuto:
    "{provider} opened in a new tab and sends it for you. If it doesn't, paste with Ctrl+V / ⌘V.",

  // Sidebar
  sidebarTitle: 'YouTube Transcript',
  close: 'Close',
  languageLabel: 'Language',
  sameAsVideo: 'Same as video',
  pasteHint:
    '{provider} opens with the prompt copied. Paste it with Ctrl+V / ⌘V.',
  askPlaceholder: 'Ask about this video…',
  ask: 'Ask',
  tabAnswer: 'Answer',
  answerEmpty:
    'Pick an analysis above. The answer shows up here, with times you can click.',
  transcriptTitle: 'Transcript',
  searchPlaceholder: 'Search transcript',
  matchCount: '{count} found',
  noMatches: 'Nothing found',
  currentSpot: 'Now',
  copyTranscript: 'Copy',
  loadingTranscript: 'Loading transcript…',
  noCaptionsHint: 'This video may have no captions.',
  retry: 'Try again',
  jumpTo: 'Play from {time}',

  // AI answer
  answerWaiting: 'Waiting for {provider}…',
  answerWriting: '{provider} is writing…',
  answerMoments: '{count} moments on the progress bar',
  answerFailedComposer:
    "Couldn't reach the {provider} chat box. Are you logged in? Open the chat and paste with Ctrl+V / ⌘V.",
  answerFailedSend:
    "The prompt didn't send. Open the chat and press Enter, or paste with Ctrl+V / ⌘V.",
  answerFailedNoReply:
    'No answer came back. Open the chat to see what happened.',
  answerCopied: 'Copied',
  openChat: 'Open chat',
  clearAnswer: 'Clear answer',

  // Prompt Editor
  editPrompts: 'Edit Prompts',
  customized: 'Edited',

  // Errors
  openVideoHint:
    'Open a YouTube video, then click this icon to see its transcript and analyze it.',
  errorGeneric: 'Error occurred',
  errorExtract: 'Cannot get transcript',
  errorOpenAi: 'Cannot open AI',
  errorReload: 'The extension was updated. Reload this page.',
  errorCopy: 'Could not copy. Try again.',
  errorChatClosed: 'That chat tab was closed.',

  // Notes and the Library page
  saveNote: 'Save to Library',
  noteSaved: 'Saved to Library',
  notePending:
    'Open the Library and click Allow access to write it to your folder.',
  noteNoFolder: 'Choose a folder in the Library to keep it as a file.',
  errorSaveNote: "Couldn't save the note. Reload the page and try again.",
  openLibrary: 'Open Library',
  libraryTitle: 'Library',
  noteCount: '{count} notes',
  folderReady: 'Saving to “{name}”',
  folderNone: 'Notes are not saved to a folder yet.',
  folderNeedsPermission: 'Chrome needs your OK to use “{name}” again.',
  folderMissing: '“{name}” was moved or deleted.',
  folderUnsupported:
    'This browser can’t save to a folder. Notes stay in the extension.',
  chooseFolder: 'Choose folder',
  changeFolder: 'Change',
  allowFolder: 'Allow access',
  notesPending: '{count} waiting to be written',
  syncImported: 'Added {count} notes from the folder.',
  syncSkipped: '{count} note files couldn’t be read.',
  syncFailed: '{count} notes couldn’t be written to the folder.',
  errorFolder: 'Couldn’t use the folder. Try again.',
  searchNotes: 'Search notes',
  notesEmpty:
    'No notes yet. After an analysis, click Save in the sidebar on YouTube.',
  askLibraryPlaceholder: 'Ask across your notes…',
  askSends: 'Sends {count} of {total} notes',
  askTooLong: 'The newest note is too long to send.',
  deleteNote: 'Delete',
  deleteConfirm: 'Delete this note and its file?',
  errorDelete: 'Couldn’t delete. Allow access to the folder, then try again.',
  openAt: 'Open the video at {time}',

  // Footer
};

// AI Prompts (sent to LLMs)
export const prompts: PromptTranslations = {
  format:
    'Answer format: start with a 2-3 sentence summary of the video, as a plain paragraph with no heading. Then one short heading and the list. Keep the whole answer under 180 words: no other sections, no closing remarks.',
  answerIn: 'Write the whole answer in {language}.',
  answerInVideo: 'Write the answer in the same language as the video.',
  keyMoments:
    'Task: the key moments of this video in order, up to 8, one line each, written as "[m:ss] what happens". End with one line: worth watching in full? Which part to watch?',
  validate:
    'Task: reality-check this video. List up to 5 of its main claims or ideas, one line each: "[m:ss] the claim. Verdict: Solid, Plausible, Doubtful or Wrong, with a short reason." If you can search the web, use it for the key facts. Otherwise judge from what you know, write "can’t verify" when unsure, and never invent sources. Flag missing context, sponsors or conflicts of interest. End with one line: how far to trust this video.',
  summary:
    'Task: the 5 most important points of this video, one line each, each starting with its [m:ss] timestamp.',
  business:
    'Task: up to 5 business insights or opportunities from this video, one line each, each with its [m:ss] timestamp.',
  actionPlan:
    'Task: an action plan based on this video, as up to 5 numbered steps, one line each, with the [m:ss] timestamp where the video covers it.',
  learning:
    'Task: up to 5 key ideas this video teaches, written as "Idea: one-line explanation [m:ss]".',
  question:
    "Answer this question using only the video transcript: {question}\n\nStart with a direct answer in 1-2 sentences. Then up to 3 supporting points, one line each, with [m:ss] timestamps. If the video doesn't cover it, say so. Under 120 words.",
  library:
    "Answer this question using only my notes above: {question}\n\nStart with a direct answer in 1-3 sentences. Then up to 6 supporting points, one line each. End each point with its source as [N3 4:05] (note number and time), or [N3] when no time fits. If the notes don't cover it, say so. Under 200 words.",
};
