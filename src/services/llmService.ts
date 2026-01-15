import type { LLMProvider, LLMRequest } from '@/types';

/**
 * LLM provider URLs
 */
const LLM_URLS: Record<LLMProvider, string> = {
  chatgpt: 'https://chat.openai.com',
  claude: 'https://claude.ai/new',
  gemini: 'https://gemini.google.com',
  grok: 'https://x.com/i/grok',
  deepseek: 'https://chat.deepseek.com',
};

/**
 * Service for LLM integration
 */
export const llmService = {
  /**
   * Get URL for LLM provider
   */
  getProviderUrl: (provider: LLMProvider): string => {
    return LLM_URLS[provider];
  },

  /**
   * Format the complete prompt with transcript
   */
  formatPrompt: (request: LLMRequest): string => {
    const { prompt, transcript, videoTitle, videoUrl } = request;

    return `${prompt}

Video: ${videoTitle}
URL: ${videoUrl}

Transcript:
${transcript}`;
  },

  /**
   * Copy text to clipboard
   */
  copyToClipboard: async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback method for browsers that don't support clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  },

  /**
   * Open LLM provider page with formatted prompt in clipboard
   */
  openLLMWithTranscript: async (request: LLMRequest): Promise<void> => {
    const formattedPrompt = llmService.formatPrompt(request);

    // Copy to clipboard
    await llmService.copyToClipboard(formattedPrompt);

    // Open LLM provider in new tab
    const url = llmService.getProviderUrl(request.provider);
    window.open(url, '_blank');
  },
};
