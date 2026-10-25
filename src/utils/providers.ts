import type { LLMProvider } from '@/types';

export interface ProviderInfo {
  value: LLMProvider;
  label: string;
  color: string;
  /** A normal chat, kept in the user's history */
  url: string;
  /** A temporary chat, kept out of the user's history and memory */
  temporaryUrl?: string;
  /** The extension fills in and sends the prompt on this site. */
  autofill: boolean;
}

export const PROVIDER_INFO: Readonly<Record<LLMProvider, ProviderInfo>> =
  Object.freeze({
    chatgpt: {
      value: 'chatgpt',
      label: 'ChatGPT',
      color: '#10a37f',
      url: 'https://chatgpt.com/',
      temporaryUrl: 'https://chatgpt.com/?temporary-chat=true',
      autofill: true,
    },
    claude: {
      value: 'claude',
      label: 'Claude',
      color: '#d97757',
      url: 'https://claude.ai/new',
      // Claude calls its temporary chats "incognito"
      temporaryUrl: 'https://claude.ai/new?incognito',
      autofill: true,
    },
    gemini: {
      value: 'gemini',
      label: 'Gemini',
      color: '#4285f4',
      url: 'https://gemini.google.com',
      autofill: false,
    },
    grok: {
      value: 'grok',
      label: 'Grok',
      color: '#1da1f2',
      url: 'https://x.com/i/grok',
      autofill: false,
    },
    deepseek: {
      value: 'deepseek',
      label: 'DeepSeek',
      color: '#7c3aed',
      url: 'https://chat.deepseek.com',
      autofill: false,
    },
  });

export const PROVIDERS: readonly ProviderInfo[] = Object.freeze(
  Object.values(PROVIDER_INFO)
);

export const DEFAULT_PROVIDER: LLMProvider = 'chatgpt';

export function isProvider(value: unknown): value is LLMProvider {
  return typeof value === 'string' && Object.hasOwn(PROVIDER_INFO, value);
}

/** Chats are temporary unless the user picked Permanent. */
export function wantsTemporaryChat(
  preferences: { temporaryChat?: unknown } | null | undefined
): boolean {
  return preferences?.temporaryChat !== false;
}

/** Where to open the chat; providers without a temporary link get a normal one. */
export function chatUrl(provider: LLMProvider, temporary: boolean): string {
  const info = PROVIDER_INFO[provider];
  return temporary && info.temporaryUrl ? info.temporaryUrl : info.url;
}
