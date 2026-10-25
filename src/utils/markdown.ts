import type { AnswerInline, AnswerNode } from '@/types';

/**
 * Markdown back into answer nodes, for reading note files. Covers what
 * answerToText writes: headings, one paragraph per line, "-" and "1." lists
 * nested by indentation, "> " quotes, ``` code blocks, "---" rules, **bold**,
 * *italic* and `code`. Links keep only their text. A backslash at the start
 * of a line marks text that only looks like markup ("\# not a heading").
 *
 * The result is plain data; callers still validate it (parseAnswerNodes).
 */

const HEADING = /^(#{1,6})\s+(.*)$/;
const LIST_ITEM = /^( *)(?:[-*+]|(\d{1,9})\.)\s+(.*)$/;
const FENCE = /^```/;
const RULE = /^(?:---|\*\*\*|___)$/;
// [text](url), where the url may hold one level of brackets
const LINK = /\[([^\]\n]*)\]\((?:[^()\s]|\([^()\s]*\))*\)/g;
/** Nested lines sit 3 spaces deeper than their list marker */
const LIST_NESTING = 3;

type Style = Omit<AnswerInline, 'text'>;

function leadingSpaces(line: string): number {
  return line.length - line.replace(/^ +/, '').length;
}

function dedent(line: string, count: number): string {
  return line.slice(Math.min(count, leadingSpaces(line)));
}

function sameStyle(a: Style, b: Style): boolean {
  return a.bold === b.bold && a.italic === b.italic && a.code === b.code;
}

/** Index of the closing marker, or -1. Markers must hug their text. */
function findClose(line: string, marker: string, from: number): number {
  const first = line[from];
  if (first === undefined || first === ' ' || first === marker[0]) return -1;
  let index = line.indexOf(marker, from + 1);
  while (index !== -1) {
    if (line[index - 1] !== ' ') return index;
    index = line.indexOf(marker, index + 1);
  }
  return -1;
}

function parseInlines(line: string): AnswerInline[] {
  const inlines: AnswerInline[] = [];
  const push = (text: string, style: Style = {}) => {
    if (text === '') return;
    const last = inlines[inlines.length - 1];
    if (last && sameStyle(last, style)) {
      last.text += text;
    } else {
      inlines.push({ text, ...style });
    }
  };

  let plain = '';
  const flushPlain = () => {
    push(plain.replace(LINK, '$1'));
    plain = '';
  };

  let index = 0;
  while (index < line.length) {
    const char = line[index];

    if (char === '`') {
      const end = line.indexOf('`', index + 1);
      if (end > index + 1) {
        flushPlain();
        push(line.slice(index + 1, end), { code: true });
        index = end + 1;
        continue;
      }
    }

    if (char === '*') {
      const marker = line.startsWith('**', index) ? '**' : '*';
      const start = index + marker.length;
      const end = findClose(line, marker, start);
      if (end !== -1) {
        flushPlain();
        push(
          line.slice(start, end).replace(LINK, '$1'),
          marker === '**' ? { bold: true } : { italic: true }
        );
        index = end + marker.length;
        continue;
      }
    }

    plain += char;
    index += 1;
  }
  flushPlain();
  return inlines;
}

function paragraph(text: string): AnswerNode | null {
  const inlines = parseInlines(text);
  return inlines.length > 0 ? { kind: 'paragraph', inlines } : null;
}

/** Read one list starting at `start`; returns the line after it. */
function parseList(
  lines: readonly string[],
  start: number,
  nodes: AnswerNode[]
): number {
  const first = LIST_ITEM.exec(lines[start] ?? '');
  if (!first) return start + 1;
  const indent = first[1]?.length ?? 0;
  const ordered = first[2] !== undefined;
  const startNumber = ordered ? Number(first[2]) : 1;

  const items: AnswerNode[][] = [];
  let index = start;
  while (index < lines.length) {
    const match = LIST_ITEM.exec(lines[index] ?? '');
    if (
      !match ||
      (match[1]?.length ?? 0) !== indent ||
      (match[2] !== undefined) !== ordered
    ) {
      break;
    }

    const itemLines = [match[3] ?? ''];
    index += 1;
    while (index < lines.length) {
      const line = lines[index] ?? '';
      if (line.trim() === '') {
        // A blank line belongs to the item only if the item goes on after it
        let next = index + 1;
        while (next < lines.length && (lines[next] ?? '').trim() === '') {
          next += 1;
        }
        if (next < lines.length && leadingSpaces(lines[next] ?? '') > indent) {
          itemLines.push('');
          index += 1;
          continue;
        }
        break;
      }
      if (leadingSpaces(line) <= indent) break;
      itemLines.push(dedent(line, indent + LIST_NESTING));
      index += 1;
    }

    const children = parseBlocks(itemLines);
    if (children.length > 0) items.push(children);
  }

  if (items.length > 0) {
    nodes.push({
      kind: 'list',
      ordered,
      ...(ordered && startNumber > 1 ? { start: startNumber } : {}),
      items,
    });
  }
  return index;
}

function parseBlocks(lines: readonly string[]): AnswerNode[] {
  const nodes: AnswerNode[] = [];
  const add = (node: AnswerNode | null) => {
    if (node) nodes.push(node);
  };

  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? '';
    const trimmed = line.trim();

    if (trimmed === '') {
      index += 1;
      continue;
    }

    if (FENCE.test(trimmed)) {
      const indent = leadingSpaces(line);
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !FENCE.test((lines[index] ?? '').trim())) {
        code.push(dedent(lines[index] ?? '', indent));
        index += 1;
      }
      index += 1; // the closing fence
      const text = code.join('\n');
      if (text.trim() !== '') add({ kind: 'code', text });
      continue;
    }

    if (trimmed.startsWith('\\')) {
      add(paragraph(trimmed.slice(1)));
      index += 1;
      continue;
    }

    if (RULE.test(trimmed)) {
      add({ kind: 'rule' });
      index += 1;
      continue;
    }

    const heading = HEADING.exec(trimmed);
    if (heading) {
      const inlines = parseInlines(heading[2] ?? '');
      const hashes = heading[1]?.length ?? 1;
      // answerToText writes level 1 as "##"
      const level = hashes <= 2 ? 1 : hashes === 3 ? 2 : 3;
      if (inlines.length > 0) add({ kind: 'heading', level, inlines });
      index += 1;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quoted: string[] = [];
      while (
        index < lines.length &&
        (lines[index] ?? '').trim().startsWith('>')
      ) {
        quoted.push((lines[index] ?? '').trim().replace(/^>\s?/, ''));
        index += 1;
      }
      const children = parseBlocks(quoted);
      if (children.length > 0) add({ kind: 'quote', children });
      continue;
    }

    if (LIST_ITEM.test(line)) {
      index = parseList(lines, index, nodes);
      continue;
    }

    add(paragraph(trimmed));
    index += 1;
  }
  return nodes;
}

export function markdownToNodes(markdown: string): AnswerNode[] {
  return parseBlocks(markdown.replace(/\r\n?/g, '\n').split('\n'));
}
