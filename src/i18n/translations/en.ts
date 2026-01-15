import type { TranslationStrings, PromptTranslations } from '../types';

export const strings: TranslationStrings = {
  // Header
  appTitle: 'YouTube Script',
  appSubtitle: 'Get video text → Send to AI',

  // Guide steps (simple)
  step1: 'Open video',
  step2: 'Pick AI',
  step3: 'Go!',

  // Form labels
  aiLabel: 'AI',
  aiHint: 'Send to',
  analysisLabel: 'Analysis',
  analysisHint: 'Type',
  chooseAi: 'Choose AI',
  chooseAnalysis: 'Analysis Type',

  // Preset titles & descriptions
  summaryTitle: 'Summary',
  summaryDesc: 'Key points',
  businessTitle: 'Business',
  businessDesc: 'Strategy tips',
  actionTitle: 'Action Plan',
  actionDesc: 'Steps to do',
  learningTitle: 'Learn',
  learningDesc: 'Main ideas',

  // Buttons
  go: 'Go!',
  working: 'Working...',
  customizePrompts: 'Edit Prompts',
  extractOnly: 'Extract Only',
  extractAgain: 'Extract Again',
  save: 'Save',
  cancel: 'Cancel',
  reset: 'Reset',
  resetAll: 'Reset All',

  // Dynamic
  quickSendTo: 'Quick Send to {provider}',
  readyPaste: 'Ready! Paste in {provider}',

  // Sidebar
  sidebarTitle: 'YouTube Transcript',
  sidebarSubtitle: 'Extract & send to AI',
  quickSendHint: 'One click: extract + send',
  clickAiBelow: 'Click an AI',
  pasteInstruction: 'We copy text to clipboard & open AI. Just paste!',
  transcriptPreview: 'Preview',

  // Prompt Editor
  editPrompts: 'Edit Prompts',
  customized: 'Edited',

  // Errors
  errorNoTab: 'No tab open',
  errorNotYouTube: 'Open a YouTube video',
  errorSelectPrompt: 'Select a prompt',
  errorGeneric: 'Error occurred',
  errorExtract: 'Cannot get transcript',
  errorOpenAi: 'Cannot open AI',

  // Footer
  footerNote: 'Works with subtitled videos',

  // Misc
  or: 'or',
};

// AI Prompts (sent to LLMs)
export const prompts: PromptTranslations = {
  summary:
    'Summarize this video in 5-7 bullet points, focusing on the main ideas and actionable insights.',
  business:
    'Extract business insights, market trends, and strategic opportunities discussed in this video.',
  actionPlan:
    'Create an action plan with concrete steps to implement the ideas from this video.',
  learning:
    'Explain the key concepts, frameworks, and best practices covered in this video.',
};
