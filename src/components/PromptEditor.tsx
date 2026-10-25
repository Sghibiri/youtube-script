import { useMemo, useState, type KeyboardEvent } from 'react';
import { useI18n } from '@/i18n';
import { getLocalizedPresets } from '@/utils/presetPrompts';
import {
  ghostButton,
  primaryButton,
  secondaryButton,
} from '@/components/controls';
import { CloseIcon } from '@/components/icons';

interface PromptEditorProps {
  customPrompts: Record<string, string>;
  onSave: (customPrompts: Record<string, string>) => void;
  onClose: () => void;
}

/** Full-height panel to rewrite the task behind each analysis button. */
export function PromptEditor({
  customPrompts,
  onSave,
  onClose,
}: PromptEditorProps) {
  const { t, prompts: promptTranslations } = useI18n();
  const [editedPrompts, setEditedPrompts] =
    useState<Record<string, string>>(customPrompts);

  const defaultPresets = useMemo(
    () => getLocalizedPresets(t, promptTranslations),
    [t, promptTranslations]
  );

  const handleReset = (promptId: string) => {
    setEditedPrompts((previous) => {
      const updated = { ...previous };
      delete updated[promptId];
      return updated;
    });
  };

  const handleSave = () => {
    // Empty or unchanged prompts go back to the default
    const kept = Object.fromEntries(
      defaultPresets
        .map((preset) => [preset.id, editedPrompts[preset.id]?.trim() ?? ''])
        .filter(
          ([id, text]) =>
            text !== '' &&
            text !== defaultPresets.find((p) => p.id === id)?.prompt
        )
    );
    onSave(kept);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
  };

  return (
    <section
      aria-labelledby="yts-edit-title"
      onKeyDown={onKeyDown}
      className="flex h-full min-h-0 flex-col"
    >
      <header className="flex items-center gap-2 border-0 border-b border-solid border-[var(--color-border-primary)] px-4 py-3">
        <h2
          id="yts-edit-title"
          className="m-0 flex-1 text-[15px] font-semibold"
        >
          {t.editPrompts}
        </h2>
        <button
          className={`${ghostButton} h-8 w-8 justify-center px-0`}
          onClick={onClose}
          aria-label={t.cancel}
          title={t.cancel}
        >
          <CloseIcon />
        </button>
      </header>

      <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-3">
        {defaultPresets.map((preset) => {
          const id = `yts-prompt-${preset.id}`;
          const edited = preset.id in editedPrompts;
          return (
            <div key={preset.id} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <label
                  htmlFor={id}
                  className="flex-1 text-[13px] font-semibold"
                >
                  {preset.title}
                </label>
                {edited && (
                  <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
                    {t.customized}
                  </span>
                )}
                <button
                  className={ghostButton}
                  onClick={() => handleReset(preset.id)}
                  disabled={!edited}
                >
                  {t.reset}
                </button>
              </div>
              <textarea
                id={id}
                rows={3}
                value={edited ? editedPrompts[preset.id] : preset.prompt}
                onChange={(event) =>
                  setEditedPrompts((previous) => ({
                    ...previous,
                    [preset.id]: event.target.value,
                  }))
                }
                className="w-full resize-y rounded-md border border-solid border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-2.5 font-sans text-[13px] leading-relaxed text-[var(--color-text-primary)] focus:border-primary focus:outline-none"
              />
            </div>
          );
        })}
      </div>

      <footer className="flex items-center gap-2 border-0 border-t border-solid border-[var(--color-border-primary)] px-4 py-3">
        <button
          className={ghostButton}
          onClick={() => setEditedPrompts({})}
          disabled={Object.keys(editedPrompts).length === 0}
        >
          {t.resetAll}
        </button>
        <button className={`${secondaryButton} ml-auto`} onClick={onClose}>
          {t.cancel}
        </button>
        <button className={primaryButton} onClick={handleSave}>
          {t.save}
        </button>
      </footer>
    </section>
  );
}
