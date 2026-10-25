import type {
  AnswerInline,
  AnswerNode,
  SavedNote,
  SaveNotePayload,
} from '@/types';
import {
  answerToText,
  parseAnswerNodes,
  splitTimestamps,
} from '@/utils/answer';
import { markdownToNodes } from '@/utils/markdown';
import { isProvider } from '@/utils/providers';
import { isVideoId } from '@/utils/youtubePage';

/**
 * Saved notes: their ids, file names, and the Markdown files they are kept
 * in. Everything coming from a message or a file is validated here.
 */

/** storage.local key of a note: `note:<id>` */
export const NOTE_KEY_PREFIX = 'note:';
/** Note files larger than this are not ours (or not readable as notes) */
export const MAX_NOTE_FILE_CHARS = 1_000_000;
export const MAX_ANALYSIS_CHARS = 200;
const MAX_TITLE_CHARS = 300;
const MAX_CHANNEL_CHARS = 200;
const MAX_FILE_BASE_CHARS = 120;
const LABEL_CHARS = 40;
const FILE_SOURCE = 'youtube-script';

const ANALYSIS_KEY = /^[a-z0-9][a-z0-9-]{0,39}$/;
const QUESTION_KEY = /^q-[0-9a-f]{8}$/;
const NOTE_ID = /^([\w-]{11})--([a-z0-9][a-z0-9-]{0,39})$/;
// Characters that file systems reject in names
const FILE_NAME_UNSAFE = /[\\/:*?"<>|]/g;
// Lines that would read back as markup rather than text
const LOOKS_LIKE_MARKUP = /^(?:#|>|[-*+]\s|\d+\.\s|```|---|\\)/;

export const noteKey = (id: string) => `${NOTE_KEY_PREFIX}${id}`;

export const noteId = (videoId: string, analysisKey: string) =>
  `${videoId}--${analysisKey}`;

export const videoUrl = (videoId: string) =>
  `https://www.youtube.com/watch?v=${videoId}`;

export const videoTimeUrl = (videoId: string, seconds: number) =>
  `${videoUrl(videoId)}&t=${Math.max(0, Math.floor(seconds))}s`;

/** Control characters (newlines, tabs…) become spaces. */
function withoutControls(text: string): string {
  let clean = '';
  for (const char of text) {
    const code = char.charCodeAt(0);
    clean += code < 32 || code === 127 ? ' ' : char;
  }
  return clean;
}

/** One trimmed line of text, or null if not a string or too long. */
function cleanLine(value: unknown, maxChars: number): string | null {
  if (typeof value !== 'string') return null;
  const text = withoutControls(value).replace(/\s+/g, ' ').trim();
  return text.length <= maxChars ? text : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Key for a free question: the same question gives the same note. */
export function questionKey(question: string): string {
  const normalized = question.trim().toLowerCase().replace(/\s+/g, ' ');
  // FNV-1a, 32 bit
  let hash = 0x811c9dc5;
  for (let index = 0; index < normalized.length; index++) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `q-${hash.toString(16).padStart(8, '0')}`;
}

function fileNamePart(text: string): string {
  return withoutControls(text)
    .replace(FILE_NAME_UNSAFE, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s]+|[.\s]+$/g, '');
}

/** "2026-10-24 Video title – Key moments.md" */
export function noteFileName({
  savedAt,
  title,
  analysis,
  analysisKey,
}: {
  savedAt: string;
  title: string;
  analysis: string;
  analysisKey: string;
}): string {
  const date = savedAt.slice(0, 10);
  const shortAnalysis = fileNamePart(
    fileNamePart(analysis).slice(0, LABEL_CHARS)
  );
  const label = QUESTION_KEY.test(analysisKey)
    ? `Q ${shortAnalysis}`.trim()
    : shortAnalysis || 'Note';
  const room = MAX_FILE_BASE_CHARS - date.length - label.length - 4;
  const name = fileNamePart(fileNamePart(title).slice(0, room)) || 'Video';
  return `${date} ${name} – ${label}.md`;
}

/** The name, or the name with the video id added if another note has it. */
export function uniqueFileName(
  name: string,
  taken: ReadonlySet<string>,
  videoId: string
): string {
  if (!taken.has(name.toLowerCase())) return name;
  const base = name.replace(/\.md$/i, '');
  let candidate = `${base} (${videoId}).md`;
  for (let count = 2; taken.has(candidate.toLowerCase()); count++) {
    candidate = `${base} (${videoId} ${count}).md`;
  }
  return candidate;
}

/** A plain file name in the folder: no paths, not hidden, ends in .md. */
export function isNoteFileName(name: string): boolean {
  return (
    name.length <= 255 &&
    /^[^/\\]+\.md$/i.test(name) &&
    !name.startsWith('.') &&
    withoutControls(name) === name
  );
}

/** Validate SAVE_NOTE from the sidebar; null when anything is off. */
export function parseSaveNotePayload(value: unknown): SaveNotePayload | null {
  const record = asRecord(value);
  if (!record) return null;

  const { videoId, analysisKey, provider } = record;
  if (!isVideoId(videoId) || !isProvider(provider)) return null;
  if (typeof analysisKey !== 'string' || !ANALYSIS_KEY.test(analysisKey)) {
    return null;
  }

  const title = cleanLine(record.title, MAX_TITLE_CHARS);
  const analysis = cleanLine(record.analysis, MAX_ANALYSIS_CHARS);
  if (!title || !analysis) return null;

  let channel: string | undefined;
  if (record.channel !== undefined) {
    const clean = cleanLine(record.channel, MAX_CHANNEL_CHARS);
    if (clean === null) return null;
    channel = clean || undefined;
  }

  const nodes = parseAnswerNodes(record.nodes);
  if (nodes.length === 0) return null;

  return {
    videoId,
    title,
    ...(channel ? { channel } : {}),
    analysisKey,
    analysis,
    provider,
    nodes,
  };
}

/** Every m:ss (or "[m:ss]") becomes a link to that moment of the video. */
function linkTimes(text: string, videoId: string): string {
  const parts = splitTimestamps(text);
  let out = '';
  let dropBracket = false;

  parts.forEach((part, index) => {
    let piece = part.text;
    if (dropBracket) {
      piece = piece.slice(1);
      dropBracket = false;
    }
    if (part.kind === 'text') {
      out += piece;
      return;
    }
    const link = `[${part.text}](${videoTimeUrl(videoId, part.seconds)})`;
    const next = parts[index + 1];
    if (out.endsWith('[') && next?.kind === 'text' && next.text[0] === ']') {
      out = out.slice(0, -1) + link;
      dropBracket = true;
    } else {
      out += link;
    }
  });
  return out;
}

function prepareInlines(
  inlines: readonly AnswerInline[],
  videoId: string
): AnswerInline[] {
  return inlines.map((inline) => {
    const text = inline.text.replace(/\n/g, ' ');
    return { ...inline, text: inline.code ? text : linkTimes(text, videoId) };
  });
}

/** Nodes ready to be written as one-line-per-paragraph Markdown. */
function prepareNodes(
  nodes: readonly AnswerNode[],
  videoId: string
): AnswerNode[] {
  return nodes.map((node): AnswerNode => {
    switch (node.kind) {
      case 'heading':
        return { ...node, inlines: prepareInlines(node.inlines, videoId) };
      case 'paragraph': {
        const inlines = prepareInlines(node.inlines, videoId);
        const first = inlines[0];
        if (
          first &&
          !first.bold &&
          !first.italic &&
          !first.code &&
          LOOKS_LIKE_MARKUP.test(first.text)
        ) {
          inlines[0] = { ...first, text: `\\${first.text}` };
        }
        return { kind: 'paragraph', inlines };
      }
      case 'list':
        return {
          ...node,
          items: node.items.map((item) => prepareNodes(item, videoId)),
        };
      case 'quote':
        return { ...node, children: prepareNodes(node.children, videoId) };
      default:
        return node;
    }
  });
}

/** The note as a Markdown file with a small info header (front matter). */
export function noteToFile(note: SavedNote): string {
  const fields: [string, string | undefined][] = [
    ['id', note.id],
    ['title', note.title],
    ['url', videoUrl(note.videoId)],
    ['channel', note.channel],
    ['analysis', note.analysis],
    ['provider', note.provider],
    ['saved', note.savedAt],
  ];
  const header = fields
    .filter((field): field is [string, string] => field[1] !== undefined)
    // JSON strings are valid YAML and keep quotes and colons intact
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);

  return [
    '---',
    `source: ${FILE_SOURCE}`,
    ...header,
    '---',
    '',
    `# ${withoutControls(note.title)}`,
    '',
    answerToText(prepareNodes(note.nodes, note.videoId)),
    '',
  ].join('\n');
}

function readValue(raw: string): string | null {
  const value = raw.trim();
  if (!value.startsWith('"')) return value;
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

/** The front matter's `source` line, without reading the whole file. */
export function isOwnNoteFile(text: string): boolean {
  return /^---\r?\n(?:.*\r?\n){0,20}?source: youtube-script\r?\n/.test(
    text.slice(0, 4000)
  );
}

/** A note read from a file in the folder, or null if it is not one. */
export function parseNoteFile(
  text: string,
  fileName: string
): SavedNote | null {
  if (text.length > MAX_NOTE_FILE_CHARS || !isNoteFileName(fileName)) {
    return null;
  }

  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  if (lines[0]?.trim() !== '---') return null;
  const end = lines.findIndex((line, index) => index > 0 && line === '---');
  if (end < 0) return null;

  const fields = new Map<string, string>();
  for (const line of lines.slice(1, end)) {
    const match = /^([A-Za-z]+):(.*)$/.exec(line);
    const value = match ? readValue(match[2] ?? '') : null;
    if (match?.[1] && value !== null) fields.set(match[1], value);
  }
  if (fields.get('source') !== FILE_SOURCE) return null;

  const idMatch = NOTE_ID.exec(fields.get('id') ?? '');
  const videoId = idMatch?.[1];
  if (!idMatch || !isVideoId(videoId)) return null;

  const provider = fields.get('provider');
  const title = cleanLine(fields.get('title'), MAX_TITLE_CHARS);
  const analysis = cleanLine(fields.get('analysis'), MAX_ANALYSIS_CHARS);
  const savedTime = Date.parse(fields.get('saved') ?? '');
  if (!isProvider(provider) || !title || !analysis) return null;
  if (Number.isNaN(savedTime)) return null;
  const channel = cleanLine(fields.get('channel'), MAX_CHANNEL_CHARS);

  // The body starts with "# <title>", written for people reading the file
  const body = lines.slice(end + 1);
  while (body.length > 0 && body[0]?.trim() === '') body.shift();
  if (body[0]?.startsWith('# ')) body.shift();

  const nodes = parseAnswerNodes(markdownToNodes(body.join('\n')));
  if (nodes.length === 0) return null;

  return {
    id: idMatch[0],
    videoId,
    title,
    ...(channel ? { channel } : {}),
    analysis,
    provider,
    savedAt: new Date(savedTime).toISOString(),
    nodes,
    fileName,
    written: true,
  };
}

/** Light shape check for notes read back from the extension's own storage. */
export function isSavedNote(value: unknown): value is SavedNote {
  const record = asRecord(value);
  return (
    record !== null &&
    typeof record.id === 'string' &&
    isVideoId(record.videoId) &&
    typeof record.title === 'string' &&
    typeof record.analysis === 'string' &&
    isProvider(record.provider) &&
    typeof record.savedAt === 'string' &&
    Array.isArray(record.nodes) &&
    typeof record.fileName === 'string' &&
    typeof record.written === 'boolean'
  );
}

/** Newest first; ties in a fixed order. */
export function sortNotes(notes: readonly SavedNote[]): SavedNote[] {
  return [...notes].sort(
    (a, b) => b.savedAt.localeCompare(a.savedAt) || a.id.localeCompare(b.id)
  );
}
