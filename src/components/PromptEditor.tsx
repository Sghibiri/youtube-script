import { useState, useMemo } from 'react';
import type { PresetPrompt } from '@/types';
import { useI18n } from '@/i18n';
import { getLocalizedPresets } from '@/utils/presetPrompts';
import './PromptEditor.css';

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
    <div className="prompt-editor-overlay" onClick={onClose}>
      <div className="prompt-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="prompt-editor-header">
          <h2>{t.editPrompts}</h2>
          <button className="close-button" onClick={onClose}>
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

        <div className="prompt-editor-content">
          {defaultPresets.map((preset) => (
            <div key={preset.id} className="prompt-edit-section">
              <div className="prompt-edit-header">
                <div className="prompt-edit-title">
                  <span className="prompt-icon">{preset.icon}</span>
                  <h3>{preset.title}</h3>
                  {isCustomized(preset.id) && (
                    <span className="custom-badge">{t.customized}</span>
                  )}
                </div>
                <button
                  className="reset-button"
                  onClick={() => handleReset(preset.id)}
                  disabled={!isCustomized(preset.id)}
                >
                  {t.reset}
                </button>
              </div>
              <p className="prompt-description">{preset.description}</p>
              <textarea
                className="prompt-textarea"
                value={getEffectivePrompt(preset)}
                onChange={(e) => handlePromptChange(preset.id, e.target.value)}
                rows={3}
                placeholder={preset.prompt}
              />
            </div>
          ))}
        </div>

        <div className="prompt-editor-footer">
          <button className="btn-secondary" onClick={handleResetAll}>
            {t.resetAll}
          </button>
          <div className="footer-actions">
            <button className="btn-secondary" onClick={onClose}>
              {t.cancel}
            </button>
            <button className="btn-primary" onClick={handleSave}>
              {t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
