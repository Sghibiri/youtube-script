import type {
  LLMProvider,
  LLMRequest,
  OpenAIPayload,
  OpenAIResult,
  SaveNotePayload,
  SaveNoteResult,
} from '@/types';
import { PROVIDER_INFO } from '@/utils/providers';

export type SendResult =
  /** watching: the answer will come back to this tab */
  | { ok: true; autoSend: boolean; watching: boolean }
  | { ok: false; reason: 'copy' | 'open' | 'reload' };

/**
 * Service for LLM integration
 */
export const llmService = {
  getProviderUrl: (provider: LLMProvider): string =>
    PROVIDER_INFO[provider].url,

  /**
   * Build the full message: video info, the timestamped transcript, then the
   * task (models follow instructions better when they come after long text).
   */
  formatPrompt: (request: Omit<LLMRequest, 'provider'>): string => {
    const { prompt, transcript, videoTitle, videoUrl } = request;

    return `Video: ${videoTitle}
URL: ${videoUrl}

Transcript (each paragraph starts with its [m:ss] timestamp):
<transcript>
${transcript}
</transcript>

${prompt}`;
  },

  /**
   * Copy text to clipboard. Returns false when the browser refuses.
   */
  copyToClipboard: async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for pages where the async clipboard API is blocked
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      return copied;
    }
  },

  /**
   * Copy the message (as a fallback) and open the AI in a new tab.
   * ChatGPT and Claude get the message filled in and sent automatically,
   * using the account the user is logged in with. With a requestId, their
   * answer is sent back to this tab and the AI tab opens in the background.
   */
  sendToAI: async (
    provider: LLMProvider,
    text: string,
    requestId?: string
  ): Promise<SendResult> => {
    const { autofill } = PROVIDER_INFO[provider];

    const copied = await llmService.copyToClipboard(text);
    if (!copied && !autofill) return { ok: false, reason: 'copy' };

    try {
      const payload: OpenAIPayload = { provider, text, requestId };
      const result = (await browser.runtime.sendMessage({
        type: 'OPEN_AI',
        payload,
      })) as OpenAIResult | undefined;

      return result?.ok
        ? { ok: true, autoSend: autofill, watching: result.watching }
        : { ok: false, reason: 'open' };
    } catch {
      // The extension was updated or reloaded since this page loaded
      return { ok: false, reason: 'reload' };
    }
  },

  /** Keep an answer as a note in the Library (and the notes folder). */
  saveNote: async (payload: SaveNotePayload): Promise<SaveNoteResult> => {
    try {
      const result = (await browser.runtime.sendMessage({
        type: 'SAVE_NOTE',
        payload,
      })) as SaveNoteResult | undefined;
      return result?.ok === true ? result : { ok: false };
    } catch {
      // The extension was updated or reloaded since this page loaded
      return { ok: false };
    }
  },

  /** Open the Library page, or bring it to the front. */
  openLibrary: async (): Promise<boolean> => {
    try {
      const result = (await browser.runtime.sendMessage({
        type: 'OPEN_LIBRARY',
      })) as { ok?: boolean } | undefined;
      return result?.ok === true;
    } catch {
      return false;
    }
  },

  /** Bring the ChatGPT / Claude tab that is answering to the front. */
  focusAITab: async (requestId: string): Promise<boolean> => {
    try {
      const result = (await browser.runtime.sendMessage({
        type: 'FOCUS_AI_TAB',
        payload: { requestId },
      })) as { ok?: boolean } | undefined;
      return result?.ok === true;
    } catch {
      return false;
    }
  },
};
