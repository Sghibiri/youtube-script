import { youtubeService } from '@/services/youtubeService';
import { llmService } from '@/services/llmService';
import type { Message, LLMRequest } from '@/types';

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  main() {
    // Listen for messages from popup
    browser.runtime.onMessage.addListener(
      (
        message: Message,
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response: unknown) => void
      ) => {
        if (message.type === 'GET_TRANSCRIPT') {
          handleGetTranscript(sendResponse);
          return true; // Keep channel open for async response
        }

        if (message.type === 'OPEN_LLM') {
          handleOpenLLM(message.payload as LLMRequest, sendResponse);
          return true;
        }

        return false;
      }
    );
  },
});

/**
 * Handle transcript extraction request
 */
async function handleGetTranscript(
  sendResponse: (response: unknown) => void
): Promise<void> {
  try {
    if (!youtubeService.isYouTubeVideoPage()) {
      sendResponse({
        type: 'ERROR',
        payload: { message: 'Not a YouTube video page' },
      });
      return;
    }

    const transcriptData = await youtubeService.fetchTranscript();

    sendResponse({
      type: 'TRANSCRIPT_RESULT',
      payload: transcriptData,
    });
  } catch (error) {
    sendResponse({
      type: 'ERROR',
      payload: {
        message:
          error instanceof Error ? error.message : 'Failed to fetch transcript',
      },
    });
  }
}

/**
 * Handle opening LLM with transcript
 */
async function handleOpenLLM(
  request: LLMRequest,
  sendResponse: (response: unknown) => void
): Promise<void> {
  try {
    await llmService.openLLMWithTranscript(request);
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({
      type: 'ERROR',
      payload: {
        message:
          error instanceof Error ? error.message : 'Failed to open LLM page',
      },
    });
  }
}
