import type { SavedNote } from '@/types';
import { answerToText } from '@/utils/answer';
import { matchesQuery } from '@/utils/transcript';

/** About 40k tokens: fits ChatGPT and Claude with room for the answer. */
export const MAX_LIBRARY_PROMPT_CHARS = 150_000;

const NOTES_INTRO =
  'My saved notes from YouTube videos. Each note starts with its number, like [N1].';

// [N3], [N3 4:05], [N3, 4:05], [N3 @ 1:02:03], [N3 4:05–5:10]
const CITATION =
  /\[N(\d{1,4})(?:\s*[,@]?\s*((?:\d{1,2}:)?\d{1,2}:\d{2})(?:\s*[-–—]\s*(?:\d{1,2}:)?\d{1,2}:\d{2})?)?\]/g;

export type CitationPart =
  | { kind: 'text'; text: string }
  /** `note` counts from 1, as written in the prompt */
  | { kind: 'cite'; text: string; note: number; seconds?: number };

/** All the text a note can be found by. */
export function noteSearchText(note: SavedNote): string {
  return [
    note.title,
    note.channel ?? '',
    note.analysis,
    answerToText(note.nodes),
  ].join('\n');
}

export function matchesNote(note: SavedNote, query: string): boolean {
  return matchesQuery(noteSearchText(note), query);
}

function noteBlock(note: SavedNote, number: number): string {
  const meta = [
    note.channel ? `Channel: ${note.channel}` : null,
    `Saved: ${note.savedAt.slice(0, 10)}`,
    `Analysis: ${note.analysis}`,
  ]
    .filter(Boolean)
    .join(' · ');
  return `[N${number}] ${note.title}\n${meta}\n${answerToText(note.nodes)}\n\n`;
}

/**
 * The message for "Ask AI": the notes, numbered in the order given (newest
 * first), as many as fit in `maxChars`, then the task.
 */
export function buildLibraryPrompt(
  notes: readonly SavedNote[],
  task: string,
  maxChars = MAX_LIBRARY_PROMPT_CHARS
): { text: string; included: number } {
  const open = `${NOTES_INTRO}\n\n<notes>\n`;
  const close = `</notes>\n\n${task}`;
  let size = open.length + close.length;

  const blocks: string[] = [];
  for (const note of notes) {
    const block = noteBlock(note, blocks.length + 1);
    if (size + block.length > maxChars) break;
    blocks.push(block);
    size += block.length;
  }
  return { text: `${open}${blocks.join('')}${close}`, included: blocks.length };
}

function timeToSeconds(value: string): number | null {
  const parts = value.split(':').map(Number);
  const seconds = parts.pop() ?? 0;
  const minutes = parts.pop() ?? 0;
  const hours = parts.pop() ?? 0;
  if (seconds >= 60 || (value.split(':').length === 3 && minutes >= 60)) {
    return null;
  }
  return hours * 3600 + minutes * 60 + seconds;
}

/** Split an answer line into text and citations of notes 1…noteCount. */
export function splitCitations(
  text: string,
  noteCount: number
): CitationPart[] {
  const parts: CitationPart[] = [];
  let plain = '';
  let last = 0;

  for (const match of text.matchAll(CITATION)) {
    const [token, number, time] = match;
    const note = Number(number);
    const seconds = time === undefined ? undefined : timeToSeconds(time);
    if (note < 1 || note > noteCount || seconds === null) continue;

    const index = match.index ?? 0;
    plain += text.slice(last, index);
    if (plain) parts.push({ kind: 'text', text: plain });
    plain = '';
    parts.push({
      kind: 'cite',
      text: token,
      note,
      ...(seconds === undefined ? {} : { seconds }),
    });
    last = index + token.length;
  }

  plain += text.slice(last);
  if (plain) parts.push({ kind: 'text', text: plain });
  return parts;
}
