// TypeScript type definitions for the extension

export type MessageType =
  | 'TOGGLE_SIDEBAR'
  | 'SHOULD_OPEN'
  | 'OPEN_AI'
  | 'HAS_HANDOFF'
  | 'CLAIM_HANDOFF'
  | 'AI_PROGRESS'
  | 'AI_ANSWER'
  | 'FOCUS_AI_TAB'
  | 'SAVE_NOTE'
  | 'OPEN_LIBRARY';

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
  /** Caption track name, e.g. "English (auto-generated)"; may be empty */
  language: string;
  /** Channel name, when YouTube's player data has it */
  channel?: string;
  /** Timestamped transcript text, ready to send to an AI */
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

/** Payload of OPEN_AI: open the provider and hand it the full message. */
export interface OpenAIPayload {
  provider: LLMProvider;
  text: string;
  /** Set to stream the answer back to the sending YouTube tab */
  requestId?: string;
}

export type OpenAIResult =
  | { ok: true; watching: boolean }
  | { ok: false; error: string };

/** A run of text inside an answer paragraph, with its formatting. */
export interface AnswerInline {
  text: string;
  bold?: true;
  italic?: true;
  code?: true;
}

/**
 * The structure of an AI answer, read from the ChatGPT / Claude page.
 * Plain data only (never HTML), so it is rendered safely by React.
 */
export type AnswerNode =
  | { kind: 'heading'; level: 1 | 2 | 3; inlines: AnswerInline[] }
  | { kind: 'paragraph'; inlines: AnswerInline[] }
  | {
      kind: 'list';
      ordered: boolean;
      start?: number;
      /** Each item is a list of nodes: its text, then any nested lists */
      items: AnswerNode[][];
    }
  | { kind: 'quote'; children: AnswerNode[] }
  | { kind: 'code'; text: string }
  | { kind: 'rule' };

export type AnswerStatus = 'sent' | 'writing' | 'done' | 'failed';

/** Why no answer came back: chat box not found, not sent, or no reply. */
export type AnswerFailure = 'composer' | 'send' | 'no-reply';

/** Payload of AI_PROGRESS (AI tab -> background) and AI_ANSWER (-> YouTube). */
export interface AnswerUpdate {
  requestId: string;
  status: AnswerStatus;
  nodes: AnswerNode[];
  failure?: AnswerFailure;
}

/**
 * An analysis kept from the sidebar: one per video and analysis (saving the
 * same analysis again replaces it). Also written as a Markdown file to the
 * notes folder the user picked.
 */
export interface SavedNote {
  /** `${videoId}--${analysisKey}` */
  id: string;
  videoId: string;
  title: string;
  channel?: string;
  /** Preset title, or the question that was asked */
  analysis: string;
  provider: LLMProvider;
  /** ISO date of the latest save */
  savedAt: string;
  nodes: AnswerNode[];
  /** File name in the notes folder; set on the first save, then kept */
  fileName: string;
  /** The folder file holds this version of the note */
  written: boolean;
}

/** Payload of SAVE_NOTE (sidebar -> background). */
export interface SaveNotePayload {
  videoId: string;
  title: string;
  channel?: string;
  /** Preset id, or `q-` + hash of the question */
  analysisKey: string;
  analysis: string;
  provider: LLMProvider;
  nodes: AnswerNode[];
}

/** Whether the note's file reached the folder, or why not yet. */
export type SaveNoteResult =
  | { ok: true; file: 'written' | 'pending' | 'no-folder' }
  | { ok: false };

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
  /** Interface language */
  language?: string;
  /** Language the AI answers in: a language code, or 'video' */
  answerLanguage?: string;
  /** Open ChatGPT / Claude as temporary chats (the default) or normal ones */
  temporaryChat?: boolean;
}

export type StorageData = Record<string, unknown> & {
  preferences?: UserPreferences;
};
