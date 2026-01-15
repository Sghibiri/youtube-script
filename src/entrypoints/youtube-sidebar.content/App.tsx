import { useState, useEffect, useMemo } from 'react';
import type { LLMProvider, UserPreferences } from '@/types';
import { useI18n } from '@/i18n';
import { youtubeService } from '@/services/youtubeService';
import { llmService } from '@/services/llmService';
import { LLMIcon } from '@/components/LLMIcon';
import { LanguageSelector } from '@/components/LanguageSelector';
import {
  getLocalizedPresets,
  getEffectivePrompts,
} from '@/utils/presetPrompts';
import toggleIcon from '@/assets/icons/toggle-icon.svg';

const LLM_PROVIDERS: {
  value: LLMProvider;
  label: string;
  icon: LLMProvider;
  color: string;
}[] = [
  { value: 'chatgpt', label: 'ChatGPT', icon: 'chatgpt', color: '#10a37f' },
  { value: 'claude', label: 'Claude', icon: 'claude', color: '#d97757' },
  { value: 'gemini', label: 'Gemini', icon: 'gemini', color: '#4285f4' },
  { value: 'grok', label: 'Grok', icon: 'grok', color: '#1da1f2' },
  { value: 'deepseek', label: 'DeepSeek', icon: 'deepseek', color: '#7c3aed' },
];

export default function App() {
  const { t, prompts: promptTranslations, formatString } = useI18n();

  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('summary');
  const [lastUsedProvider, setLastUsedProvider] =
    useState<LLMProvider>('gemini');
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>(
    {}
  );

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
        setLastUsedProvider(prefs.defaultProvider || 'gemini');
        if (prefs.defaultPromptId) {
          setSelectedPromptId(prefs.defaultPromptId);
        }
        if (prefs.customPrompts) {
          setCustomPrompts(prefs.customPrompts);
        }
      }
    });
  }, []);

  const extractTranscript = async () => {
    setLoading(true);
    setError(null);

    try {
      const transcriptData = await youtubeService.fetchTranscript();
      setTranscript(transcriptData.transcript);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorExtract);
    } finally {
      setLoading(false);
    }
  };

  const sendToAI = async (provider: LLMProvider) => {
    if (!transcript) return;

    const selectedPrompt = effectivePrompts.find(
      (p) => p.id === selectedPromptId
    );
    if (!selectedPrompt) return;

    try {
      const videoTitle = youtubeService.getVideoTitle();
      const videoUrl = youtubeService.getVideoUrl();

      await llmService.openLLMWithTranscript({
        provider,
        transcript,
        prompt: selectedPrompt.prompt,
        videoTitle,
        videoUrl,
      });

      // Remember last used provider for quick send
      setLastUsedProvider(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorOpenAi);
    }
  };

  // Quick send: Extract + send to last used AI in one click
  const quickSend = async () => {
    setLoading(true);
    setError(null);

    try {
      const transcriptData = await youtubeService.fetchTranscript();
      setTranscript(transcriptData.transcript);

      // Immediately send to last used provider
      const selectedPrompt = effectivePrompts.find(
        (p) => p.id === selectedPromptId
      );
      if (!selectedPrompt) return;

      const videoTitle = youtubeService.getVideoTitle();
      const videoUrl = youtubeService.getVideoUrl();

      await llmService.openLLMWithTranscript({
        provider: lastUsedProvider,
        transcript: transcriptData.transcript,
        prompt: selectedPrompt.prompt,
        videoTitle,
        videoUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorExtract);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        className="ys-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={t.sidebarTitle}
      >
        <img src={toggleIcon} alt={t.sidebarTitle} className="ys-toggle-icon" />
      </button>

      {/* Sidebar */}
      {isOpen && (
        <div className="ys-sidebar">
          <div className="ys-sidebar-header">
            <div className="ys-sidebar-header-content">
              <div className="ys-header-title">
                <svg
                  className="ys-header-icon"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <rect
                    x="5"
                    y="4"
                    width="14"
                    height="16"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="8"
                    y1="9"
                    x2="16"
                    y2="9"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="8"
                    y1="13"
                    x2="16"
                    y2="13"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="8"
                    y1="17"
                    x2="13"
                    y2="17"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                <h2>{t.sidebarTitle}</h2>
              </div>
              <p>{t.sidebarSubtitle}</p>
            </div>
            <div className="ys-header-actions">
              <LanguageSelector variant="sidebar" />
              <button className="ys-close-btn" onClick={() => setIsOpen(false)}>
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
          </div>

          <div className="ys-sidebar-content">
            {/* Quick Send Button - Power User Feature */}
            {!transcript && (
              <>
                <div className="ys-quick-send-section">
                  <button
                    className="ys-btn ys-btn-quick"
                    onClick={quickSend}
                    disabled={loading}
                  >
                    {loading
                      ? `⚡ ${t.working}`
                      : `⚡ ${formatString(t.quickSendTo, {
                          provider:
                            LLM_PROVIDERS.find(
                              (p) => p.value === lastUsedProvider
                            )?.label || 'AI',
                        })}`}
                  </button>
                  <p className="ys-quick-hint">{t.quickSendHint}</p>
                </div>

                <div className="ys-divider">
                  <span>{t.or}</span>
                </div>

                <button
                  className="ys-btn ys-btn-secondary"
                  onClick={extractTranscript}
                  disabled={loading}
                >
                  ▶ {t.extractOnly}
                </button>
              </>
            )}

            {/* Error */}
            {error && <div className="ys-error">{error}</div>}

            {/* AI Providers & Transcript */}
            {transcript && (
              <>
                {/* Paste Instruction */}
                <div className="ys-paste-info">
                  <div className="ys-paste-icon">📋</div>
                  <div className="ys-paste-text">
                    <strong>{t.clickAiBelow}</strong>
                    <p>{t.pasteInstruction}</p>
                  </div>
                </div>

                {/* AI Provider Buttons */}
                <div className="ys-section">
                  <label>{t.chooseAi}</label>
                  <div className="ys-ai-grid">
                    {LLM_PROVIDERS.map((provider) => (
                      <button
                        key={provider.value}
                        className="ys-ai-btn"
                        onClick={() => sendToAI(provider.value)}
                        style={
                          {
                            '--ai-color': provider.color,
                          } as React.CSSProperties
                        }
                      >
                        <LLMIcon
                          provider={provider.icon}
                          className="ys-ai-icon"
                        />
                        <span className="ys-ai-label">{provider.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset Prompt Selection */}
                <div className="ys-section">
                  <label className="ys-section-label">{t.chooseAnalysis}</label>
                  <div className="ys-preset-list">
                    {effectivePrompts.map((preset) => (
                      <label key={preset.id} className="ys-preset-option">
                        <input
                          type="radio"
                          name="preset"
                          value={preset.id}
                          checked={selectedPromptId === preset.id}
                          onChange={(e) => setSelectedPromptId(e.target.value)}
                          className="ys-preset-radio"
                        />
                        <div className="ys-preset-content">
                          <span className="ys-preset-icon">{preset.icon}</span>
                          <div className="ys-preset-text">
                            <div className="ys-preset-title">
                              {preset.title}
                            </div>
                            <div className="ys-preset-desc">
                              {preset.description}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Transcript Display */}
                <div className="ys-section">
                  <label>{t.transcriptPreview}</label>
                  <div className="ys-transcript">{transcript}</div>
                </div>

                {/* Extract Again Button */}
                <button
                  className="ys-btn ys-btn-secondary"
                  onClick={() => setTranscript(null)}
                >
                  🔄 {t.extractAgain}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
