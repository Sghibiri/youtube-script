import type { AnswerInline, AnswerNode } from '@/types';
import {
  MAX_ANSWER_DEPTH,
  MAX_ANSWER_NODES,
  MAX_TEXT_CHARS,
} from '@/utils/answer';

/**
 * Read the structure of a rendered ChatGPT / Claude answer: headings,
 * paragraphs, nested and numbered lists, quotes, code and bold text.
 * Only text and structure are kept, never HTML, links or attributes.
 */

const HEADING_LEVEL: Readonly<Record<string, 1 | 2 | 3>> = Object.freeze({
  H1: 1,
  H2: 1,
  H3: 2,
  H4: 3,
  H5: 3,
  H6: 3,
});

// Controls and media in the reply (copy buttons, citations, icons)
const SKIPPED_TAGS = new Set([
  'BUTTON',
  'SVG',
  'STYLE',
  'SCRIPT',
  'NOSCRIPT',
  'TEXTAREA',
  'INPUT',
  'SELECT',
  'NAV',
  'IMG',
  'FORM',
  'TEMPLATE',
]);

const BOLD_TAGS = new Set(['STRONG', 'B']);
const ITALIC_TAGS = new Set(['EM', 'I']);
const CODE_TAGS = new Set(['CODE', 'KBD', 'SAMP']);
const TABLE_ROW_TAGS = new Set(['TR']);

interface Style {
  bold?: true;
  italic?: true;
  code?: true;
}

interface Reader {
  budget: number;
}

function shouldSkip(element: Element): boolean {
  return (
    SKIPPED_TAGS.has(element.tagName.toUpperCase()) ||
    element.getAttribute('aria-hidden') === 'true' ||
    element.classList.contains('sr-only')
  );
}

/** Collapse whitespace across a run of inlines and drop empty ones. */
function tidy(inlines: AnswerInline[]): AnswerInline[] {
  const merged: AnswerInline[] = [];
  for (const inline of inlines) {
    const text = inline.code ? inline.text : inline.text.replace(/\s+/g, ' ');
    if (text === '') continue;
    const previous = merged[merged.length - 1];
    if (
      previous &&
      previous.bold === inline.bold &&
      previous.italic === inline.italic &&
      previous.code === inline.code
    ) {
      previous.text += text;
    } else {
      merged.push({ ...inline, text });
    }
  }

  // Trim the run as a whole, not each piece
  const first = merged[0];
  if (first) first.text = first.text.trimStart();
  const last = merged[merged.length - 1];
  if (last) last.text = last.text.trimEnd();

  const clean = merged
    .filter((inline) => inline.text !== '')
    .map((inline) => ({
      ...inline,
      text: inline.text.slice(0, MAX_TEXT_CHARS),
    }));
  return clean.some((inline) => inline.text.trim() !== '') ? clean : [];
}

/**
 * Walks an element's children, collecting text into paragraphs and turning
 * block elements into nodes.
 */
function readChildren(
  parent: Element,
  depth: number,
  reader: Reader
): AnswerNode[] {
  const nodes: AnswerNode[] = [];
  let pending: AnswerInline[] = [];

  const flush = () => {
    const inlines = tidy(pending);
    pending = [];
    if (inlines.length > 0 && reader.budget > 0) {
      reader.budget -= 1;
      nodes.push({ kind: 'paragraph', inlines });
    }
  };

  const collectInline = (node: Node, style: Style) => {
    if (node.nodeType === 3 /* text */) {
      const text = node.textContent ?? '';
      if (text) pending.push({ text, ...style });
      return;
    }
    if (node.nodeType !== 1 /* element */) return;
    const element = node as Element;
    if (shouldSkip(element)) return;

    const tag = element.tagName.toUpperCase();
    if (tag === 'BR') {
      flush();
      return;
    }
    if (isBlock(element)) {
      flush();
      nodes.push(...readBlock(element, depth, reader));
      return;
    }

    const next: Style = {
      ...style,
      ...(BOLD_TAGS.has(tag) ? { bold: true } : {}),
      ...(ITALIC_TAGS.has(tag) ? { italic: true } : {}),
      ...(CODE_TAGS.has(tag) ? { code: true } : {}),
    };
    element.childNodes.forEach((child) => collectInline(child, next));
  };

  parent.childNodes.forEach((child) => collectInline(child, {}));
  flush();
  return nodes;
}

const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'SECTION',
  'ARTICLE',
  'UL',
  'OL',
  'LI',
  'BLOCKQUOTE',
  'PRE',
  'HR',
  'TABLE',
  'THEAD',
  'TBODY',
  'TR',
  'FIGURE',
  'DETAILS',
  'SUMMARY',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
]);

function isBlock(element: Element): boolean {
  return BLOCK_TAGS.has(element.tagName.toUpperCase());
}

/** Inline content of an element as one run (for headings and table rows). */
function readInlines(element: Element): AnswerInline[] {
  const inlines: AnswerInline[] = [];
  const walk = (node: Node, style: Style) => {
    if (node.nodeType === 3) {
      const text = node.textContent ?? '';
      if (text) inlines.push({ text, ...style });
      return;
    }
    if (node.nodeType !== 1) return;
    const child = node as Element;
    if (shouldSkip(child)) return;
    const tag = child.tagName.toUpperCase();
    if (tag === 'BR' || TABLE_ROW_TAGS.has(tag)) {
      inlines.push({ text: ' ', ...style });
    }
    const next: Style = {
      ...style,
      ...(BOLD_TAGS.has(tag) ? { bold: true } : {}),
      ...(ITALIC_TAGS.has(tag) ? { italic: true } : {}),
      ...(CODE_TAGS.has(tag) ? { code: true } : {}),
    };
    child.childNodes.forEach((grandchild) => walk(grandchild, next));
    if (tag === 'TD' || tag === 'TH') inlines.push({ text: ' · ', ...style });
  };
  element.childNodes.forEach((child) => walk(child, {}));
  return tidy(inlines);
}

function readBlock(
  element: Element,
  depth: number,
  reader: Reader
): AnswerNode[] {
  if (reader.budget <= 0 || depth > MAX_ANSWER_DEPTH) return [];
  const tag = element.tagName.toUpperCase();

  const level = HEADING_LEVEL[tag];
  if (level) {
    const inlines = readInlines(element);
    if (inlines.length === 0) return [];
    reader.budget -= 1;
    return [{ kind: 'heading', level, inlines }];
  }

  switch (tag) {
    case 'UL':
    case 'OL': {
      const items: AnswerNode[][] = [];
      for (const child of Array.from(element.children)) {
        if (reader.budget <= 0) break;
        if (child.tagName.toUpperCase() !== 'LI' || shouldSkip(child)) continue;
        reader.budget -= 1;
        const content = readChildren(child, depth + 1, reader);
        if (content.length > 0) items.push(content);
      }
      if (items.length === 0) return [];
      const start = Number(element.getAttribute('start'));
      return [
        {
          kind: 'list',
          ordered: tag === 'OL',
          ...(tag === 'OL' && Number.isInteger(start) && start > 1
            ? { start }
            : {}),
          items,
        },
      ];
    }
    case 'BLOCKQUOTE': {
      const children = readChildren(element, depth + 1, reader);
      return children.length > 0 ? [{ kind: 'quote', children }] : [];
    }
    case 'PRE': {
      const text = (element.textContent ?? '').replace(/\s+$/, '');
      if (!text.trim()) return [];
      reader.budget -= 1;
      return [{ kind: 'code', text: text.slice(0, MAX_TEXT_CHARS) }];
    }
    case 'HR':
      return [{ kind: 'rule' }];
    case 'TR': {
      const inlines = readInlines(element);
      const text = inlines.map((inline) => inline.text).join('');
      if (!text.replace(/[\s·]/g, '')) return [];
      reader.budget -= 1;
      // Drop the trailing cell separator
      const last = inlines[inlines.length - 1];
      if (last) last.text = last.text.replace(/\s*·\s*$/, '');
      return [{ kind: 'paragraph', inlines: inlines.filter((i) => i.text) }];
    }
    default:
      // P, DIV, SECTION, LI outside a list, table parts…
      return readChildren(element, depth, reader);
  }
}

/** Read a rendered answer into plain, structured data. */
export function readAnswer(root: Element): AnswerNode[] {
  return readChildren(root, 0, { budget: MAX_ANSWER_NODES });
}
