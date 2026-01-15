import type { Message } from '@/types';

/**
 * Service for extension messaging between background, content, and popup
 */
export const messageService = {
  /**
   * Send message to background script
   */
  sendToBackground: (message: Message) => {
    return chrome.runtime.sendMessage(message);
  },

  /**
   * Send message to active tab
   */
  sendToTab: (tabId: number, message: Message) => {
    return chrome.tabs.sendMessage(tabId, message);
  },

  /**
   * Listen for messages
   */
  onMessage: (callback: (message: Message) => void) => {
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      callback(message);
      return true; // Keep channel open for async responses
    });
  },
};
