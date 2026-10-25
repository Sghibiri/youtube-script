import type {
  AnswerFailure,
  AnswerInline,
  AnswerNode,
  AnswerStatus,
  AnswerUpdate,
} from '@/types';

export interface Moment {
  seconds: number;
  label: string;
}

export type TimestampPart =
  | { kind: 'text'; text: string }
  | { kind: 'time'; text: string; seconds: number };

const STATUSES: readonly AnswerStatus[] = ['sent', 'writing', 'done', 'failed'];
const FAILURES: readonly AnswerFailure[] = ['composer', 'send', 'no-reply'];

const REQUEST_ID_PATTERN = /^[\w-]{1,64}$/;
/** Paragraphs, headings and list items in one answer */
export const MAX_ANSWER_NODES = 500;
export const MAX_TEXT_CHARS = 4000;
const MAX_INLINES = 200;
/** Lists inside lists inside quotes… */
export const MAX_ANSWER_DEPTH = 6;
const MAX_MOMENTS = 60;
const MAX_LABEL_CHARS = 90;
const MAX_SUMMARY_PARAGRAPHS = 3;

// m:ss or h:mm:ss, not part of a longer number
const TIMESTAMP_PATTERN =
  /(?<![\d:])(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?![\d:])/g;
// "[3:03] ", "(1:02:03) – ", "3:03–5:00: " at the start of a line
const LEADING_TIMESTAMP =
  /^\s*[[(]?\s*(((?:(\d{1,2}):)?(\d{1,2}):(\d{2}))(?:\s*[-–—]\s*(?:\d{1,2}:)?\d{1,2}:\d{2})?)\s*[\])]?\s*(?:[-–—:|]\s*)?/;

export function isRequestId(value: unknown): value is string {
  return typeof value === 'string' && REQUEST_ID_PATTERN.test(value);
}

function isOneOf<T extends string>(
  values: readonly T[],
  value: unknown
): value is T {
  return (
    typeof value === 'string' && (values as readonly string[]).includes(value)
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Counts nodes while validating, so one answer cannot grow without limit. */
interface Budget {
  left: number;
}

function parseInlines(value: unknown): AnswerInline[] {
  if (!Array.isArray(value)) return [];
  const clean: AnswerInline[] = [];
  for (const item of value.slice(0, MAX_INLINES)) {
    const record = asRecord(item);
    if (!record || typeof record.text !== 'string' || record.text === '') {
      continue;
    }
    clean.push({
      text: record.text.slice(0, MAX_TEXT_CHARS),
      ...(record.bold === true ? { bold: true } : {}),
      ...(record.italic === true ? { italic: true } : {}),
      ...(record.code === true ? { code: true } : {}),
    });
  }
  return clean.some((inline) => inline.text.trim() !== '') ? clean : [];
}

function parseList(
  record: Record<string, unknown>,
  depth: number,
  budget: Budget
): AnswerNode | null {
  if (!Array.isArray(record.items)) return null;
  const items: AnswerNode[][] = [];
  for (const entry of record.items) {
    if (budget.left <= 0) break;
    budget.left -= 1;
    const children = parseNodes(entry, depth + 1, budget);
    if (children.length > 0) items.push(children);
  }
  if (items.length === 0) return null;

  const start = Number(record.start);
  return {
    kind: 'list',
    ordered: record.ordered === true,
    ...(Number.isInteger(start) && start > 1 && start < 10_000
      ? { start }
      : {}),
    items,
  };
}

function parseNode(
  record: Record<string, unknown>,
  depth: number,
  budget: Budget
): AnswerNode | null {
  switch (record.kind) {
    case 'paragraph': {
      const inlines = parseInlines(record.inlines);
      if (inlines.length === 0) return null;
      budget.left -= 1;
      return { kind: 'paragraph', inlines };
    }
    case 'heading': {
      const inlines = parseInlines(record.inlines);
      if (inlines.length === 0) return null;
      budget.left -= 1;
      const level = Number(record.level);
      return {
        kind: 'heading',
        level: level <= 1 ? 1 : level === 2 ? 2 : 3,
        inlines,
      };
    }
    case 'list':
      return parseList(record, depth, budget);
    case 'quote': {
      const children = parseNodes(record.children, depth + 1, budget);
      return children.length > 0 ? { kind: 'quote', children } : null;
    }
    case 'code': {
      if (typeof record.text !== 'string' || record.text.trim() === '') {
        return null;
      }
      budget.left -= 1;
      return { kind: 'code', text: record.text.slice(0, MAX_TEXT_CHARS) };
    }
    case 'rule':
      return { kind: 'rule' };
    default:
      return null;
  }
}

function parseNodes(
  value: unknown,
  depth: number,
  budget: Budget
): AnswerNode[] {
  if (!Array.isArray(value) || depth > MAX_ANSWER_DEPTH) return [];
  const nodes: AnswerNode[] = [];
  for (const item of value) {
    if (budget.left <= 0) break;
    const record = asRecord(item);
    const node = record ? parseNode(record, depth, budget) : null;
    if (node) nodes.push(node);
  }
  return nodes;
}

/** Validate answer nodes from outside this context (a message, a file). */
export function parseAnswerNodes(value: unknown): AnswerNode[] {
  return parseNodes(value, 0, { left: MAX_ANSWER_NODES });
}

/** Validate an answer update coming from another part of the extension. */
export function parseAnswerUpdate(value: unknown): AnswerUpdate | null {
  const record = asRecord(value);
  if (!record) return null;
  const { requestId, status, nodes, failure } = record;
  if (!isRequestId(requestId) || !isOneOf(STATUSES, status)) return null;
  if (!Array.isArray(nodes)) return null;

  return {
    requestId,
    status,
    nodes: parseAnswerNodes(nodes),
    ...(isOneOf(FAILURES, failure) ? { failure } : {}),
  };
}

function toSeconds(
  hours: string | undefined,
  minutes: string,
  seconds: string
): number | null {
  const h = hours === undefined ? 0 : Number(hours);
  const m = Number(minutes);
  const s = Number(seconds);
  if (s >= 60 || (hours !== undefined && m >= 60)) return null;
  return h * 3600 + m * 60 + s;
}

/**
 * Split text into plain parts and timestamps (m:ss, h:mm:ss).
 * Timestamps past `maxSeconds` (the end of the video) stay plain text.
 */
export function splitTimestamps(
  text: string,
  maxSeconds = Number.POSITIVE_INFINITY
): TimestampPart[] {
  const parts: TimestampPart[] = [];
  let last = 0;

  for (const match of text.matchAll(TIMESTAMP_PATTERN)) {
    const [token, hours, minutes, secs] = match;
    const seconds = toSeconds(hours, minutes ?? '', secs ?? '');
    if (seconds === null || seconds > maxSeconds) continue;

    const index = match.index ?? 0;
    if (index > last) {
      parts.push({ kind: 'text', text: text.slice(last, index) });
    }
    parts.push({ kind: 'time', text: token, seconds });
    last = index + token.length;
  }

  if (last < text.length) parts.push({ kind: 'text', text: text.slice(last) });
  return parts;
}

export function inlineText(inlines: readonly AnswerInline[]): string {
  return inlines.map((inline) => inline.text).join('');
}

/** Drop the first `count` characters from a run of inlines. */
function dropChars(
  inlines: readonly AnswerInline[],
  count: number
): AnswerInline[] {
  const rest: AnswerInline[] = [];
  let left = count;
  for (const inline of inlines) {
    if (left >= inline.text.length) {
      left -= inline.text.length;
      continue;
    }
    rest.push({ ...inline, text: inline.text.slice(left) });
    left = 0;
  }
  return rest;
}

/**
 * A line that starts with a timestamp ("[3:03] Intro…", "3:03–5:00: …"):
 * the time to show in the gutter and the text after it.
 */
export function splitLeadingTimestamp(
  inlines: readonly AnswerInline[],
  maxSeconds = Number.POSITIVE_INFINITY
): { label: string; seconds: number; rest: AnswerInline[] } | null {
  const match = LEADING_TIMESTAMP.exec(inlineText(inlines));
  if (!match) return null;
  const [whole, label, , hours, minutes, secs] = match;
  const seconds = toSeconds(hours, minutes ?? '', secs ?? '');
  if (seconds === null || seconds > maxSeconds || !label) return null;
  return {
    label: label.replace(/\s+/g, ''),
    seconds,
    rest: dropChars(inlines, whole.length),
  };
}

/** The inlines a list item starts with: its first paragraph or heading. */
export function leadInlines(nodes: readonly AnswerNode[]): AnswerInline[] {
  const first = nodes[0];
  return first && (first.kind === 'paragraph' || first.kind === 'heading')
    ? first.inlines
    : [];
}

/**
 * The answer's opening summary: the short run of paragraphs before the first
 * heading or list (what the prompt asks the AI to start with).
 */
export function splitSummary(nodes: readonly AnswerNode[]): {
  summary: AnswerNode[];
  rest: AnswerNode[];
} {
  let count = 0;
  while (count < nodes.length && nodes[count]?.kind === 'paragraph') count++;
  if (count === 0 || count > MAX_SUMMARY_PARAGRAPHS) {
    return { summary: [], rest: [...nodes] };
  }
  return { summary: nodes.slice(0, count), rest: nodes.slice(count) };
}

/** Every line of text in reading order: paragraphs, headings, list items. */
function answerLines(nodes: readonly AnswerNode[]): string[] {
  const lines: string[] = [];
  for (const node of nodes) {
    switch (node.kind) {
      case 'heading':
      case 'paragraph':
        lines.push(inlineText(node.inlines));
        break;
      case 'list':
        node.items.forEach((item) => lines.push(...answerLines(item)));
        break;
      case 'quote':
        lines.push(...answerLines(node.children));
        break;
      default:
        break;
    }
  }
  return lines;
}

function cleanLabel(text: string): string {
  const label = text
    // Brackets left behind where the timestamp was: "[]", "()"
    .replace(/[[(]\s*[\])]/g, '')
    .replace(/^[\s[\]()\-–—:.,|•*]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return label.length > MAX_LABEL_CHARS
    ? `${label.slice(0, MAX_LABEL_CHARS - 1).trimEnd()}…`
    : label;
}

/**
 * Moments for the progress bar: the first timestamp of each answer line,
 * labelled with the rest of that line. Sorted, one per second.
 */
export function extractMoments(
  nodes: readonly AnswerNode[],
  maxSeconds = Number.POSITIVE_INFINITY
): Moment[] {
  const bySecond = new Map<number, Moment>();

  for (const line of answerLines(nodes)) {
    const parts = splitTimestamps(line, maxSeconds);
    const timeIndex = parts.findIndex((part) => part.kind === 'time');
    const time = parts[timeIndex];
    if (!time || time.kind !== 'time' || bySecond.has(time.seconds)) continue;

    const rest = parts
      .filter((_, index) => index !== timeIndex)
      .map((part) => part.text)
      .join('');
    bySecond.set(time.seconds, {
      seconds: time.seconds,
      label: cleanLabel(rest),
    });
  }

  return [...bySecond.values()]
    .sort((a, b) => a.seconds - b.seconds)
    .slice(0, MAX_MOMENTS);
}

function inlineMarkdown(inlines: readonly AnswerInline[]): string {
  return inlines
    .map(({ text, bold, italic, code }) => {
      if (code) return `\`${text}\``;
      const trimmed = text.trim();
      if (!trimmed || (!bold && !italic)) return text;
      const mark = bold ? '**' : '*';
      // Keep surrounding spaces outside the markers
      const lead = text.slice(0, text.indexOf(trimmed));
      const tail = text.slice(lead.length + trimmed.length);
      return `${lead}${mark}${trimmed}${mark}${tail}`;
    })
    .join('');
}

function nodesToMarkdown(
  nodes: readonly AnswerNode[],
  indent: string
): string[] {
  const lines: string[] = [];
  for (const node of nodes) {
    switch (node.kind) {
      case 'heading':
        lines.push(
          `${indent}${'#'.repeat(node.level + 1)} ${inlineMarkdown(node.inlines)}`
        );
        break;
      case 'paragraph':
        lines.push(`${indent}${inlineMarkdown(node.inlines)}`);
        break;
      case 'list':
        node.items.forEach((item, index) => {
          const marker = node.ordered ? `${(node.start ?? 1) + index}.` : '-';
          const [first = '', ...rest] = nodesToMarkdown(item, `${indent}   `);
          lines.push(`${indent}${marker} ${first.trimStart()}`, ...rest);
        });
        break;
      case 'quote':
        lines.push(...nodesToMarkdown(node.children, `${indent}> `));
        break;
      case 'code':
        lines.push(
          `${indent}\`\`\``,
          ...node.text.split('\n').map((line) => `${indent}${line}`),
          `${indent}\`\`\``
        );
        break;
      case 'rule':
        lines.push(`${indent}---`);
        break;
    }
  }
  return lines;
}

/** The answer as Markdown, for copying into notes or another chat. */
export function answerToText(nodes: readonly AnswerNode[]): string {
  return nodesToMarkdown(nodes, '').join('\n');
}
