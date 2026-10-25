import { describe, expect, it } from 'vitest';
import { chatUrl, wantsTemporaryChat } from './providers';

describe('wantsTemporaryChat', () => {
  it('defaults to temporary', () => {
    expect(wantsTemporaryChat(undefined)).toBe(true);
    expect(wantsTemporaryChat(null)).toBe(true);
    expect(wantsTemporaryChat({})).toBe(true);
    expect(wantsTemporaryChat({ temporaryChat: true })).toBe(true);
  });

  it('is permanent only when the user picked it', () => {
    expect(wantsTemporaryChat({ temporaryChat: false })).toBe(false);
    expect(wantsTemporaryChat({ temporaryChat: 'no' })).toBe(true);
  });
});

describe('chatUrl', () => {
  it('opens temporary chats on ChatGPT and Claude', () => {
    expect(chatUrl('chatgpt', true)).toBe(
      'https://chatgpt.com/?temporary-chat=true'
    );
    expect(chatUrl('claude', true)).toBe('https://claude.ai/new?incognito');
  });

  it('opens normal chats when permanent', () => {
    expect(chatUrl('chatgpt', false)).toBe('https://chatgpt.com/');
    expect(chatUrl('claude', false)).toBe('https://claude.ai/new');
  });

  it('opens a normal chat where there is no temporary link', () => {
    expect(chatUrl('gemini', true)).toBe('https://gemini.google.com');
  });
});
