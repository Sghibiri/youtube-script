import type { PresetPrompt } from '@/types';
import type { TranslationStrings, PromptTranslations } from '@/i18n/types';

// Default preset prompts - used when no i18n context available
export const DEFAULT_PRESET_PROMPTS: PresetPrompt[] = [
  {
    id: 'summary',
    title: 'Summary',
    description: 'Key points',
    prompt:
      'Summarize this video in 5-7 bullet points, focusing on the main ideas and actionable insights.',
    icon: '📋',
  },
  {
    id: 'business',
    title: 'Business',
    description: 'Strategy tips',
    prompt:
      'Extract business insights, market trends, and strategic opportunities discussed in this video.',
    icon: '📊',
  },
  {
    id: 'action-plan',
    title: 'Action Plan',
    description: 'Steps to do',
    prompt:
      'Create an action plan with concrete steps to implement the ideas from this video.',
    icon: '✅',
  },
  {
    id: 'learning',
    title: 'Learn',
    description: 'Main ideas',
    prompt:
      'Explain the key concepts, frameworks, and best practices covered in this video.',
    icon: '🎓',
  },
];

// For backwards compatibility
export const PRESET_PROMPTS = DEFAULT_PRESET_PROMPTS;

// Get localized presets using translation strings
export function getLocalizedPresets(
  t: TranslationStrings,
  prompts: PromptTranslations
): PresetPrompt[] {
  return [
    {
      id: 'summary',
      title: t.summaryTitle,
      description: t.summaryDesc,
      prompt: prompts.summary,
      icon: '📋',
    },
    {
      id: 'business',
      title: t.businessTitle,
      description: t.businessDesc,
      prompt: prompts.business,
      icon: '📊',
    },
    {
      id: 'action-plan',
      title: t.actionTitle,
      description: t.actionDesc,
      prompt: prompts.actionPlan,
      icon: '✅',
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
