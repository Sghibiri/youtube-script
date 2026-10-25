import type { TranscriptSegment } from '@/types';

export interface TranscriptParagraph {
  start: number;
  text: string;
}

export interface TextPart {
  text: string;
  match: boolean;
}

const PARAGRAPH_MAX_SECONDS = 30;
const PARAGRAPH_MAX_SEGMENTS = 15;

/** 75 -> "1:15", 3723 -> "1:02:03" */
export function formatTimestamp(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = String(seconds % 60).padStart(2, '0');
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}`
    : `${minutes}:${secs}`;
}

/** "1:15" -> 75, "1:02:03" -> 3723; anything else -> 0 */
export function parseTimestamp(value: string): number {
  const parts = value.trim().split(':').map(Number);
  if (parts.length < 2 || parts.length > 3) return 0;
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

/** Collapse whitespace and newlines inside a caption line. */
export function normalizeCaptionText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Group caption lines into ~30 second paragraphs that keep their start time. */
export function groupIntoParagraphs(
  segments: readonly TranscriptSegment[]
): TranscriptParagraph[] {
  const paragraphs: TranscriptParagraph[] = [];
  let start = 0;
  let texts: string[] = [];

  for (const segment of segments) {
    if (texts.length === 0) start = segment.start;
    texts.push(segment.text);

    const tooLong = segment.start - start >= PARAGRAPH_MAX_SECONDS;
    if (tooLong || texts.length >= PARAGRAPH_MAX_SEGMENTS) {
      paragraphs.push({ start, text: texts.join(' ') });
      texts = [];
    }
  }

  if (texts.length > 0) {
    paragraphs.push({ start, text: texts.join(' ') });
  }

  return paragraphs;
}

/** Transcript text sent to the AI: one "[m:ss] text" paragraph per block. */
export function formatTranscriptForAI(
  paragraphs: readonly TranscriptParagraph[]
): string {
  return paragraphs
    .map(
      (paragraph) => `[${formatTimestamp(paragraph.start)}] ${paragraph.text}`
    )
    .join('\n\n');
}

/** Index of the paragraph playing at `seconds`, or -1 before the first one. */
export function findParagraphAt(
  paragraphs: readonly { start: number }[],
  seconds: number
): number {
  let low = 0;
  let high = paragraphs.length - 1;
  let found = -1;

  while (low <= high) {
    const middle = (low + high) >> 1;
    const paragraph = paragraphs[middle];
    if (paragraph && paragraph.start <= seconds) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return found;
}

export function matchesQuery(text: string, query: string): boolean {
  const needle = query.trim().toLowerCase();
  return needle === '' || text.toLowerCase().includes(needle);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Split text into matching / non-matching parts for highlighting. */
export function splitByQuery(text: string, query: string): TextPart[] {
  const needle = query.trim();
  if (needle === '') return [{ text, match: false }];

  return text
    .split(new RegExp(`(${escapeRegExp(needle)})`, 'gi'))
    .map((part, index) => ({ text: part, match: index % 2 === 1 }))
    .filter((part) => part.text.length > 0);
}
