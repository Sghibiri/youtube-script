import { useState } from 'react';
import type { LLMProvider } from '@/types';

const LLM_ICON_URLS: Record<LLMProvider, string> = {
  chatgpt:
    'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg',
  claude:
    'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/anthropic.svg',
  gemini: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/google.svg',
  grok: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/x.svg',
  deepseek:
    'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/deepseek.svg',
};

interface LLMIconProps {
  provider: LLMProvider;
  className?: string;
}

export function LLMIcon({ provider, className }: LLMIconProps) {
  const [error, setError] = useState(false);
  const iconUrl = LLM_ICON_URLS[provider];

  if (error) {
    // Fallback to text labels if CDN fails
    return <span className={className}>{provider}</span>;
  }

  return (
    <img
      src={iconUrl}
      alt={`${provider} icon`}
      className={className}
      onError={() => setError(true)}
    />
  );
}
