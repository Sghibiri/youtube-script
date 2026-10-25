import type { PresetPrompt } from '@/types';
import type { TranslationStrings, PromptTranslations } from '@/i18n/types';
import {
  strings as enStrings,
  prompts as enPrompts,
} from '@/i18n/translations/en';
import { ANSWER_LANGUAGES, VIDEO_LANGUAGE } from '@/i18n';

export const DEFAULT_PROMPT_ID = 'key-moments';

/**
 * The full task sent to the AI: what to do, the shared answer shape (short
 * summary first, then a brief list) and the language to answer in.
 * Free questions bring their own shape, so they skip the shared one.
 */
export function buildTask(
  task: string,
  prompts: PromptTranslations,
  answerLanguage: string,
  { shared = true }: { shared?: boolean } = {}
): string {
  const name = ANSWER_LANGUAGES.find(
    (language) => language.code === answerLanguage
  )?.name;
  const languageLine =
    answerLanguage === VIDEO_LANGUAGE || !name
      ? prompts.answerInVideo
      : prompts.answerIn.replace('{language}', name);

  return [task, shared ? prompts.format : null, languageLine]
    .filter((part): part is string => Boolean(part))
    .join('\n\n');
}

// Get localized presets using translation strings
export function getLocalizedPresets(
  t: TranslationStrings,
  prompts: PromptTranslations
): PresetPrompt[] {
  return [
    {
      id: 'key-moments',
      title: t.keyMomentsTitle,
      description: t.keyMomentsDesc,
      prompt: prompts.keyMoments,
      icon: '⏱️',
    },
    {
      id: 'summary',
      title: t.summaryTitle,
      description: t.summaryDesc,
      prompt: prompts.summary,
      icon: '📋',
    },
    {
      id: 'validate',
      title: t.validateTitle,
      description: t.validateDesc,
      prompt: prompts.validate,
      icon: '🔎',
    },
    {
      id: 'action-plan',
      title: t.actionTitle,
      description: t.actionDesc,
      prompt: prompts.actionPlan,
      icon: '✅',
    },
    {
      id: 'business',
      title: t.businessTitle,
      description: t.businessDesc,
      prompt: prompts.business,
      icon: '📊',
    },
    {
      id: 'learning',
      title: t.learningTitle,
      description: t.learningDesc,
      prompt: prompts.learning,
      icon: '🎓',
    },
  ];
}

// Default preset prompts - used when no i18n context available
export const DEFAULT_PRESET_PROMPTS: PresetPrompt[] = getLocalizedPresets(
  enStrings,
  enPrompts
);

// For backwards compatibility
export const PRESET_PROMPTS = DEFAULT_PRESET_PROMPTS;

// Helper to merge default prompts with user customizations
export function getEffectivePrompts(
  customPrompts?: Record<string, string>,
  basePrompts: PresetPrompt[] = DEFAULT_PRESET_PROMPTS
): PresetPrompt[] {
  if (!customPrompts || Object.keys(customPrompts).length === 0) {
    return basePrompts;
  }

  return basePrompts.map((preset) => ({
    ...preset,
    prompt: customPrompts[preset.id] || preset.prompt,
  }));
}
