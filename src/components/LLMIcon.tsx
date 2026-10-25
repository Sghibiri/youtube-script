import { useState } from 'react';
import type { LLMProvider } from '@/types';
import chatgptIcon from '@/assets/icons/llm/chatgpt.svg';
import claudeIcon from '@/assets/icons/llm/claude.svg';
import geminiIcon from '@/assets/icons/llm/gemini.svg';
import grokIcon from '@/assets/icons/llm/grok.svg';
import deepseekIcon from '@/assets/icons/llm/deepseek.svg';

// Bundled with the extension: no request to a third-party CDN on every page
const LLM_ICON_URLS: Record<LLMProvider, string> = {
  chatgpt: chatgptIcon,
  claude: claudeIcon,
  gemini: geminiIcon,
  grok: grokIcon,
  deepseek: deepseekIcon,
};

interface LLMIconProps {
  provider: LLMProvider;
  className?: string;
}

export function LLMIcon({ provider, className }: LLMIconProps) {
  const [error, setError] = useState(false);
  const iconUrl = LLM_ICON_URLS[provider];

  if (error) {
    return null;
  }

  // Decorative: the provider name is always shown next to the icon
  return (
    <img
      src={iconUrl}
      alt=""
      className={className}
      onError={() => setError(true)}
    />
  );
}
