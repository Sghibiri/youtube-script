import { useState, useEffect, useMemo } from 'react';
import type { LLMProvider, TranscriptData, UserPreferences } from '@/types';
import { useI18n } from '@/i18n';
import {
  getLocalizedPresets,
  getEffectivePrompts,
} from '@/utils/presetPrompts';
import { PromptEditor } from '@/components/PromptEditor';
import { LanguageSelector } from '@/components/LanguageSelector';
import './App.css';

const LLM_PROVIDERS: { value: LLMProvider; label: string }[] = [
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'grok', label: 'Grok' },
  { value: 'deepseek', label: 'DeepSeek' },
];

function App() {
  const { t, prompts: promptTranslations, formatString } = useI18n();

  const [selectedProvider, setSelectedProvider] =
    useState<LLMProvider>('gemini');
  const [selectedPromptId, setSelectedPromptId] = useState<string>('summary');
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>(
    {}
  );
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);

  // Get localized presets
  const localizedPresets = useMemo(
    () => getLocalizedPresets(t, promptTranslations),
    [t, promptTranslations]
  );

  // Get effective prompts (with user customizations applied)
  const effectivePrompts = useMemo(
    () => getEffectivePrompts(customPrompts, localizedPresets),
    [customPrompts, localizedPresets]
  );

  // Load preferences from storage
  useEffect(() => {
    chrome.storage.local.get(['preferences'], (result) => {
      const prefs = result.preferences as UserPreferences | undefined;
      if (prefs) {
        setSelectedProvider(prefs.defaultProvider);
        if (prefs.defaultPromptId) {
          setSelectedPromptId(prefs.defaultPromptId);
        }
        if (prefs.customPrompts) {
          setCustomPrompts(prefs.customPrompts);
        }
      }
    });
  }, []);

  // Save preferences when they change
  const savePreferences = () => {
    const preferences: UserPreferences = {
      defaultProvider: selectedProvider,
      defaultPromptId: selectedPromptId,
      customPrompts: customPrompts,
    };
    chrome.storage.local.set({ preferences });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const selectedPrompt = effectivePrompts.find(
      (p) => p.id === selectedPromptId
    );
    if (!selectedPrompt) {
      setError(t.errorSelectPrompt);
      setLoading(false);
      return;
    }

    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        throw new Error(t.errorNoTab);
      }

      // Check if it's a YouTube page
      if (!tab.url?.includes('youtube.com/watch')) {
        throw new Error(t.errorNotYouTube);
      }

      // Send message to content script to get transcript
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_TRANSCRIPT',
      });

      if (response.type === 'ERROR') {
        throw new Error(response.payload.message);
      }

      const transcriptData = response.payload as TranscriptData;
      setVideoTitle(transcriptData.title);

      // Send message to open LLM with transcript
      await chrome.tabs.sendMessage(tab.id, {
        type: 'OPEN_LLM',
        payload: {
          provider: selectedProvider,
          transcript: transcriptData.transcript,
          prompt: selectedPrompt.prompt,
          videoTitle: transcriptData.title,
          videoUrl: transcriptData.videoUrl,
        },
      });

      setSuccess(true);
      savePreferences();

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <LanguageSelector variant="popup" />
        <h1>📺 {t.appTitle}</h1>
        <p>{t.appSubtitle}</p>
        {!success && !loading && (
          <div className="header-guide">
            <div className="guide-step">
              <span className="step-number">1</span>
              <span>{t.step1}</span>
            </div>
            <div className="guide-step">
              <span className="step-number">2</span>
              <span>{t.step2}</span>
            </div>
            <div className="guide-step">
              <span className="step-number">3</span>
              <span>{t.step3}</span>
            </div>
          </div>
        )}
      </header>

      <div className="form">
        <div className="form-group">
          <label htmlFor="provider">
            <span className="label-text">{t.aiLabel}</span>
            <span className="label-hint">{t.aiHint}</span>
          </label>
          <select
            id="provider"
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value as LLMProvider)}
            disabled={loading}
          >
            {LLM_PROVIDERS.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>
            <span className="label-text">{t.analysisLabel}</span>
            <span className="label-hint">{t.analysisHint}</span>
          </label>
          <div className="preset-list">
            {effectivePrompts.map((preset) => (
              <label key={preset.id} className="preset-option">
                <input
                  type="radio"
                  name="preset"
                  value={preset.id}
                  checked={selectedPromptId === preset.id}
                  onChange={(e) => setSelectedPromptId(e.target.value)}
                  disabled={loading}
                  className="preset-radio"
                />
                <div className="preset-content">
                  <span className="preset-icon">{preset.icon}</span>
                  <div className="preset-text">
                    <div className="preset-title">{preset.title}</div>
                    <div className="preset-description">
                      {preset.description}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          <button
            className="customize-prompts-btn"
            onClick={() => setShowPromptEditor(true)}
            disabled={loading}
            type="button"
          >
            ✏️ {t.customizePrompts}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {success && (
          <div className="success-message">
            ✓{' '}
            {formatString(t.readyPaste, {
              provider:
                LLM_PROVIDERS.find((p) => p.value === selectedProvider)
                  ?.label || 'AI',
            })}
            {videoTitle && <div className="video-title">{videoTitle}</div>}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="submit-btn"
        >
          {loading ? t.working : t.go}
        </button>
      </div>

      <footer>
        <small>{t.footerNote}</small>
      </footer>

      {showPromptEditor && (
        <PromptEditor
          customPrompts={customPrompts}
          onSave={(newCustomPrompts) => {
            setCustomPrompts(newCustomPrompts);
            savePreferences();
            setShowPromptEditor(false);
          }}
          onClose={() => setShowPromptEditor(false)}
        />
      )}
    </div>
  );
}

export default App;
