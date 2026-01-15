import { useState, useMemo } from 'react';
import type { PresetPrompt } from '@/types';
import { useI18n } from '@/i18n';
import { getLocalizedPresets } from '@/utils/presetPrompts';

interface PromptEditorProps {
  customPrompts: Record<string, string>;
  onSave: (customPrompts: Record<string, string>) => void;
  onClose: () => void;
}

export function PromptEditor({
  customPrompts,
  onSave,
  onClose,
}: PromptEditorProps) {
  const { t, prompts: promptTranslations } = useI18n();
  const [editedPrompts, setEditedPrompts] =
    useState<Record<string, string>>(customPrompts);

  // Get localized default prompts
  const defaultPresets = useMemo(
    () => getLocalizedPresets(t, promptTranslations),
    [t, promptTranslations]
  );

  const handlePromptChange = (promptId: string, newValue: string) => {
    setEditedPrompts((prev) => ({
      ...prev,
      [promptId]: newValue,
    }));
  };

  const handleReset = (promptId: string) => {
    setEditedPrompts((prev) => {
      const updated = { ...prev };
      delete updated[promptId];
      return updated;
    });
  };

  const handleResetAll = () => {
    setEditedPrompts({});
  };

  const handleSave = () => {
    onSave(editedPrompts);
  };

  const getEffectivePrompt = (preset: PresetPrompt): string => {
    return editedPrompts[preset.id] || preset.prompt;
  };

  const isCustomized = (promptId: string): boolean => {
    return promptId in editedPrompts;
  };

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-5 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-[600px] max-h-[90vh] flex-col rounded-lg bg-white shadow-elevated animate-scale-in dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <h2 className="m-0 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t.editPrompts}
          </h2>
          <button
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            onClick={onClose}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5L15 15M5 15L15 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="scrollbar-thin flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          {defaultPresets.map((preset) => (
            <div key={preset.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-2">
                  <span className="text-xl leading-none">{preset.icon}</span>
                  <h3 className="m-0 text-base font-semibold text-gray-900 dark:text-gray-100">
                    {preset.title}
                  </h3>
                  {isCustomized(preset.id) && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      {t.customized}
                    </span>
                  )}
                </div>
                <button
                  className="cursor-pointer whitespace-nowrap rounded-md border border-gray-300 bg-transparent px-3 py-1.5 text-sm font-medium text-gray-500 transition-all duration-200 hover:border-gray-400 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  onClick={() => handleReset(preset.id)}
                  disabled={!isCustomized(preset.id)}
                >
                  {t.reset}
                </button>
              </div>
              <p className="m-0 text-sm text-gray-500 dark:text-gray-400">
                {preset.description}
              </p>
              <textarea
                className="min-h-[80px] w-full resize-y rounded-lg border-2 border-gray-200 bg-white p-3 font-sans text-sm leading-relaxed text-gray-900 transition-colors duration-200 hover:border-gray-300 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-600"
                value={getEffectivePrompt(preset)}
                onChange={(e) => handlePromptChange(preset.id, e.target.value)}
                rows={3}
                placeholder={preset.prompt}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 gap-3 dark:border-gray-800">
          <button
            className="cursor-pointer rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-200 hover:border-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-100"
            onClick={handleResetAll}
          >
            {t.resetAll}
          </button>
          <div className="flex gap-3">
            <button
              className="cursor-pointer rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-200 hover:border-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              onClick={onClose}
            >
              {t.cancel}
            </button>
            <button
              className="cursor-pointer rounded-md border-none bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-hover"
              onClick={handleSave}
            >
              {t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
