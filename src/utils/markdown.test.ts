import { describe, expect, it } from 'vitest';
import { markdownToNodes } from '@/utils/markdown';

describe('markdownToNodes', () => {
  it('reads paragraphs, headings and blank lines', () => {
    expect(markdownToNodes('## Title\n\nFirst line\nSecond line\n')).toEqual([
      { kind: 'heading', level: 1, inlines: [{ text: 'Title' }] },
      { kind: 'paragraph', inlines: [{ text: 'First line' }] },
      { kind: 'paragraph', inlines: [{ text: 'Second line' }] },
    ]);
  });

  it('keeps the start of numbered lists and splits list kinds', () => {
    expect(markdownToNodes('3. three\n4. four\n- dot')).toEqual([
      {
        kind: 'list',
        ordered: true,
        start: 3,
        items: [
          [{ kind: 'paragraph', inlines: [{ text: 'three' }] }],
          [{ kind: 'paragraph', inlines: [{ text: 'four' }] }],
        ],
      },
      {
        kind: 'list',
        ordered: false,
        items: [[{ kind: 'paragraph', inlines: [{ text: 'dot' }] }]],
      },
    ]);
  });

  it('keeps only the text of links', () => {
    expect(
      markdownToNodes('See [this](javascript:alert(1)) and [1:00](https://x.y)')
    ).toEqual([
      { kind: 'paragraph', inlines: [{ text: 'See this and 1:00' }] },
    ]);
  });

  it('leaves lone stars as text', () => {
    expect(markdownToNodes('5 * 3 * 2 and **bold**')).toEqual([
      {
        kind: 'paragraph',
        inlines: [{ text: '5 * 3 * 2 and ' }, { text: 'bold', bold: true }],
      },
    ]);
  });

  it('reads an unclosed code fence to the end', () => {
    expect(markdownToNodes('```\ncode line')).toEqual([
      { kind: 'code', text: 'code line' },
    ]);
  });
});
