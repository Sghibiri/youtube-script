import { describe, expect, it } from 'vitest';
import type { AnswerNode, SavedNote } from '@/types';
import {
  noteFileName,
  noteId,
  noteToFile,
  parseNoteFile,
  parseSaveNotePayload,
  questionKey,
  uniqueFileName,
} from '@/utils/notes';

const VIDEO_ID = 'dQw4w9WgXcQ';

const text = (value: string) => [{ text: value }];

const NODES: AnswerNode[] = [
  { kind: 'paragraph', inlines: text('A short summary of the video.') },
  { kind: 'heading', level: 1, inlines: text('Key moments') },
  {
    kind: 'list',
    ordered: true,
    items: [
      [{ kind: 'paragraph', inlines: text('[0:42] The intro') }],
      [
        {
          kind: 'paragraph',
          inlines: [
            { text: '3:03 ' },
            { text: 'Main idea', bold: true },
            { text: ' and ' },
            { text: 'a detail', italic: true },
          ],
        },
        {
          kind: 'list',
          ordered: false,
          items: [
            [{ kind: 'paragraph', inlines: text('Nested at 1:02:03') }],
            [
              {
                kind: 'paragraph',
                inlines: [{ text: 'run ' }, { text: 'npm test', code: true }],
              },
            ],
          ],
        },
      ],
    ],
  },
  { kind: 'quote', children: [{ kind: 'paragraph', inlines: text('Quoted') }] },
  { kind: 'code', text: 'const a = 1;\nconst b = 2;' },
  { kind: 'rule' },
  { kind: 'paragraph', inlines: text('# not a heading') },
  { kind: 'paragraph', inlines: text('- not a list') },
  { kind: 'heading', level: 3, inlines: text('Small heading') },
];

function makeNote(overrides: Partial<SavedNote> = {}): SavedNote {
  return {
    id: noteId(VIDEO_ID, 'key-moments'),
    videoId: VIDEO_ID,
    title: 'Title with "quotes": and colons',
    channel: 'Some Channel',
    analysis: 'Key moments',
    provider: 'chatgpt',
    savedAt: '2026-10-24T10:00:00.000Z',
    nodes: NODES,
    fileName: '2026-10-24 Title – Key moments.md',
    written: true,
    ...overrides,
  };
}

describe('questionKey', () => {
  it('is stable across case and spacing', () => {
    const key = questionKey('What is the  main point?');
    expect(key).toMatch(/^q-[0-9a-f]{8}$/);
    expect(questionKey('  what is the main POINT? ')).toBe(key);
    expect(questionKey('Another question')).not.toBe(key);
  });
});

describe('noteFileName', () => {
  it('removes characters files cannot hold', () => {
    expect(
      noteFileName({
        savedAt: '2026-10-24T10:00:00.000Z',
        title: 'A: "B"/C?',
        analysis: 'Key moments',
        analysisKey: 'key-moments',
      })
    ).toBe('2026-10-24 A B C – Key moments.md');
  });

  it('keeps names short and marks questions', () => {
    const name = noteFileName({
      savedAt: '2026-10-24T10:00:00.000Z',
      title: 'x'.repeat(300),
      analysis: 'Why does the speaker think this works so well in practice?',
      analysisKey: questionKey('why'),
    });
    expect(name.endsWith('.md')).toBe(true);
    expect(name.length).toBeLessThanOrEqual(123);
    expect(name).toContain(' – Q Why does the speaker think this works');
  });

  it('never starts with a dot', () => {
    const name = noteFileName({
      savedAt: '2026-10-24T10:00:00.000Z',
      title: '...',
      analysis: 'Summary',
      analysisKey: 'summary',
    });
    expect(name).toBe('2026-10-24 Video – Summary.md');
  });
});

describe('uniqueFileName', () => {
  it('adds the video id only when the name is taken', () => {
    expect(uniqueFileName('a.md', new Set(), VIDEO_ID)).toBe('a.md');
    expect(uniqueFileName('A.md', new Set(['a.md']), VIDEO_ID)).toBe(
      `A (${VIDEO_ID}).md`
    );
  });
});

describe('parseSaveNotePayload', () => {
  const valid = {
    videoId: VIDEO_ID,
    title: 'A video',
    channel: 'A channel',
    analysisKey: 'key-moments',
    analysis: 'Key moments',
    provider: 'claude',
    nodes: NODES,
  };

  it('accepts a valid payload', () => {
    const parsed = parseSaveNotePayload(valid);
    expect(parsed?.videoId).toBe(VIDEO_ID);
    expect(parsed?.channel).toBe('A channel');
    expect(parsed?.nodes.length).toBe(NODES.length);
  });

  it.each([
    ['bad video id', { videoId: '../../etc' }],
    ['unknown provider', { provider: 'other' }],
    ['no answer', { nodes: [] }],
    ['empty title', { title: '  ' }],
    ['huge title', { title: 'x'.repeat(301) }],
    ['huge analysis', { analysis: 'x'.repeat(201) }],
    ['bad analysis key', { analysisKey: 'Key Moments!' }],
  ])('rejects %s', (_, change) => {
    expect(parseSaveNotePayload({ ...valid, ...change })).toBeNull();
  });

  it('rejects things that are not objects', () => {
    expect(parseSaveNotePayload(null)).toBeNull();
    expect(parseSaveNotePayload('note')).toBeNull();
  });
});

describe('note files', () => {
  it('writes front matter and links every time to the video', () => {
    const file = noteToFile(makeNote());
    expect(file.startsWith('---\nsource: youtube-script\n')).toBe(true);
    expect(file).toContain('title: "Title with \\"quotes\\": and colons"');
    expect(file).toContain(
      `[0:42](https://www.youtube.com/watch?v=${VIDEO_ID}&t=42s) The intro`
    );
    expect(file).toContain(
      `[1:02:03](https://www.youtube.com/watch?v=${VIDEO_ID}&t=3723s)`
    );
    // Times inside code stay as they are
    expect(file).toContain('`npm test`');
  });

  it('reads back what it wrote', () => {
    const note = makeNote();
    const parsed = parseNoteFile(noteToFile(note), note.fileName);
    expect(parsed).not.toBeNull();
    expect(parsed).toMatchObject({
      id: note.id,
      videoId: VIDEO_ID,
      title: note.title,
      channel: note.channel,
      analysis: note.analysis,
      provider: note.provider,
      savedAt: note.savedAt,
      fileName: note.fileName,
      written: true,
    });

    // Times come back as plain text; "[0:42]" loses its brackets
    const expected = JSON.parse(
      JSON.stringify(NODES).replace('[0:42] The intro', '0:42 The intro')
    );
    expect(parsed?.nodes).toEqual(expected);
  });

  it('keeps notes without a channel', () => {
    const note = makeNote({ channel: undefined });
    const parsed = parseNoteFile(noteToFile(note), note.fileName);
    expect(parsed?.channel).toBeUndefined();
  });

  it('accepts Windows line endings', () => {
    const note = makeNote();
    const file = noteToFile(note).replace(/\n/g, '\r\n');
    expect(parseNoteFile(file, note.fileName)?.id).toBe(note.id);
  });

  it.each([
    ['no front matter', '# Just notes\n\nSome text'],
    ['another source', '---\nsource: other\nid: "x"\n---\n\nText'],
    [
      'bad id',
      `---\nsource: youtube-script\nid: "../x"\ntitle: "T"\nanalysis: "A"\nprovider: "chatgpt"\nsaved: "2026-10-24T10:00:00.000Z"\n---\n\nText`,
    ],
    [
      'bad provider',
      `---\nsource: youtube-script\nid: "${VIDEO_ID}--summary"\ntitle: "T"\nanalysis: "A"\nprovider: "other"\nsaved: "2026-10-24T10:00:00.000Z"\n---\n\nText`,
    ],
    [
      'bad date',
      `---\nsource: youtube-script\nid: "${VIDEO_ID}--summary"\ntitle: "T"\nanalysis: "A"\nprovider: "chatgpt"\nsaved: "yesterday"\n---\n\nText`,
    ],
    [
      'empty body',
      `---\nsource: youtube-script\nid: "${VIDEO_ID}--summary"\ntitle: "T"\nanalysis: "A"\nprovider: "chatgpt"\nsaved: "2026-10-24T10:00:00.000Z"\n---\n\n# T\n`,
    ],
  ])('rejects a file with %s', (_, file) => {
    expect(parseNoteFile(file, 'note.md')).toBeNull();
  });

  it('rejects oversized files and unsafe file names', () => {
    const note = makeNote();
    const file = noteToFile(note);
    expect(parseNoteFile(file + 'x'.repeat(1_000_001), 'a.md')).toBeNull();
    expect(parseNoteFile(file, '../a.md')).toBeNull();
    expect(parseNoteFile(file, 'a.txt')).toBeNull();
  });
});
