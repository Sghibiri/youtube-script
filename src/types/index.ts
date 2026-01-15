// TypeScript type definitions for the extension

export type MessageType =
  | 'GET_TRANSCRIPT'
  | 'TRANSCRIPT_RESULT'
  | 'OPEN_LLM'
  | 'ERROR';

export interface Message {
  type: MessageType;
  payload?: unknown;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface TranscriptData {
  videoId: string;
  title: string;
  videoUrl: string;
  transcript: string;
  segments: TranscriptSegment[];
}

export type LLMProvider = 'chatgpt' | 'claude' | 'gemini' | 'grok' | 'deepseek';

export interface LLMRequest {
  provider: LLMProvider;
  transcript: string;
  prompt: string;
  videoTitle: string;
  videoUrl: string;
}

export interface PresetPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: string;
}

export interface CustomPrompts {
  [promptId: string]: string;
}

export interface UserPreferences {
  defaultProvider: LLMProvider;
  defaultPromptId: string;
  customPrompts?: CustomPrompts;
  language?: string;
}

export type StorageData = Record<string, unknown> & {
  preferences?: UserPreferences;
};
