import { describe, expect, it } from 'vitest';
import type { SavedNote } from '@/types';
import {
  buildLibraryPrompt,
  matchesNote,
  splitCitations,
} from '@/utils/library';

function note(
  index: number,
  body = `Point ${index} at 1:0${index}`
): SavedNote {
  return {
    id: `video000000${index}--summary`,
    videoId: `video000000${index}`,
    title: `Video ${index}`,
    channel: `Channel ${index}`,
    analysis: 'Summary',
    provider: 'chatgpt',
    savedAt: `2026-10-2${index}T10:00:00.000Z`,
    nodes: [{ kind: 'paragraph', inlines: [{ text: body }] }],
    fileName: `note-${index}.md`,
    written: true,
  };
}

describe('buildLibraryPrompt', () => {
  it('numbers the notes in the order given, then adds the task', () => {
    const { text, included } = buildLibraryPrompt([note(3), note(2)], 'TASK');
    expect(included).toBe(2);
    expect(text.indexOf('[N1] Video 3')).toBeGreaterThan(-1);
    expect(text.indexOf('[N2] Video 2')).toBeGreaterThan(
      text.indexOf('[N1] Video 3')
    );
    expect(text).toContain('Point 3 at 1:03');
    expect(text).toContain(
      'Channel: Channel 3 · Saved: 2026-10-23 · Analysis: Summary'
    );
    expect(text.trimEnd().endsWith('TASK')).toBe(true);
  });

  it('stops before the size limit', () => {
    const big = (index: number) => note(index, 'x'.repeat(1000));
    const notes = [big(1), big(2), big(3)];
    const { text, included } = buildLibraryPrompt(notes, 'TASK', 2600);
    expect(included).toBe(2);
    expect(text.length).toBeLessThanOrEqual(2600);
    expect(text).not.toContain('[N3]');
  });

  it('includes nothing when even one note is too big', () => {
    const { included } = buildLibraryPrompt(
      [note(1, 'x'.repeat(500))],
      'T',
      100
    );
    expect(included).toBe(0);
  });
});

describe('splitCitations', () => {
  it('finds note citations with and without a time', () => {
    expect(splitCitations('See [N2 4:05] and [N1].', 2)).toEqual([
      { kind: 'text', text: 'See ' },
      { kind: 'cite', text: '[N2 4:05]', note: 2, seconds: 245 },
      { kind: 'text', text: ' and ' },
      { kind: 'cite', text: '[N1]', note: 1 },
      { kind: 'text', text: '.' },
    ]);
  });

  it.each([
    ['[N2, 4:05]', 245],
    ['[N2 @ 4:05]', 245],
    ['[N2 1:02:03]', 3723],
    ['[N2 4:05–5:10]', 245],
  ])('reads %s', (citation, seconds) => {
    expect(splitCitations(citation, 2)).toEqual([
      { kind: 'cite', text: citation, note: 2, seconds },
    ]);
  });

  it('leaves unknown notes and bad times as text', () => {
    expect(splitCitations('[N9] [N0] [N1 4:75]', 2)).toEqual([
      { kind: 'text', text: '[N9] [N0] [N1 4:75]' },
    ]);
  });
});

describe('matchesNote', () => {
  it('searches title, channel, analysis and answer', () => {
    const saved = note(1, 'Talks about compound interest');
    expect(matchesNote(saved, 'video 1')).toBe(true);
    expect(matchesNote(saved, 'channel 1')).toBe(true);
    expect(matchesNote(saved, 'summary')).toBe(true);
    expect(matchesNote(saved, 'COMPOUND')).toBe(true);
    expect(matchesNote(saved, 'crypto')).toBe(false);
    expect(matchesNote(saved, '  ')).toBe(true);
  });
});
