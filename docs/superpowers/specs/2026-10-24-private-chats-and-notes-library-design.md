# Private chats and the notes library — design

Date: 2026-10-24 · Status: approved, implemented (see the plan in docs/superpowers/plans/)

## Goal

1. ChatGPT and Claude chats opened by the extension stay out of the user's
   chat history.
2. After an analysis, one click saves its key ideas as a note. Notes live as
   Markdown files in a folder the user picks, and a Library page lets the
   user search them and ask ChatGPT / Claude questions across all of them,
   with answers that link back to the right video at the right time.

## 1. Private chats (always on, no setting)

- `src/utils/providers.ts`: ChatGPT opens `https://chatgpt.com/?temporary-chat=true`,
  Claude opens `https://claude.ai/new?incognito`.
- Nothing else changes: the autofill content script already matches every
  path on both sites.
- README: say chats are private and disappear when their tab is closed; save
  the note to keep the ideas.
- Manual check (needs a logged-in browser): both URLs open the private mode
  and auto-send plus answer reading still work.

## 2. Saved notes

### Data

```ts
interface SavedNote {
  id: string;          // `${videoId}--${analysisKey}`
  videoId: string;
  title: string;
  url: string;         // https://www.youtube.com/watch?v=<videoId>
  channel?: string;
  analysis: string;    // preset title, or the question (max 200 chars)
  provider: LLMProvider;
  savedAt: string;     // ISO date of the latest save
  nodes: AnswerNode[]; // the answer as shown
  fileName: string;    // set on first save, then reused
  written: boolean;    // the folder file matches this note
}
```

- `analysisKey`: the preset id, or `q-` + 8-hex FNV-1a hash of the trimmed,
  lower-cased question. Saving the same analysis of the same video again
  replaces the note (and its file).
- Index: `chrome.storage.local`, one key per note (`note:<id>`), so saves from
  several tabs never overwrite each other. Add the `unlimitedStorage`
  permission (no install warning).
- `channel` comes from `videoDetails.author` in the player response; added to
  `TranscriptData` as optional (the transcript-panel fallback has none).

### Note file

`<YYYY-MM-DD> <title> – <analysis>.md`, with characters invalid in file names
(`/\:*?"<>|`, control characters) removed, spaces collapsed, at most 120
characters before `.md`. Questions use `Q <first 40 chars>` as the analysis
part. If another note in the index already uses the name, ` (<videoId>)` is
added before `.md`.

```markdown
---
source: youtube-script
id: "dQw4w9WgXcQ--key-moments"
title: "Video title"
url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
channel: "Channel name"
analysis: "Key moments"
provider: "chatgpt"
saved: "2026-10-24T10:00:00.000Z"
---

# Video title

<answer as Markdown (existing answerToText); every m:ss or [m:ss] becomes
[m:ss](https://www.youtube.com/watch?v=<id>&t=<seconds>s)>
```

Front-matter values are JSON strings (also valid YAML), so titles with quotes
or colons parse back exactly. Reading a file back (`parseNoteFile`):
requires `source: youtube-script` and valid id/title/url/videoId/provider/date,
drops the `# title` line, turns the body Markdown back into `AnswerNode[]`
(the subset `answerToText` writes: headings, paragraphs, `-`/`1.` lists with
3-space nesting, `>` quotes, code fences, `---`, bold, italic, inline code),
turns time links back into plain `m:ss`, and runs the result through the same
validation and limits as live answers. Files over 1 MB are skipped.

### Folder (File System Access API, Chrome only)

`src/services/notesFolder.ts`, used by the Library page and the background:

- The folder handle is kept in the extension's own IndexedDB (never in
  YouTube's origin).
- Status: `none` (no folder) · `needs-permission` (Chrome forgot the access,
  e.g. after a restart) · `missing` (folder moved or deleted) · `ready`.
- **Choose folder** (Library, user click): `showDirectoryPicker`
  (`mode: 'readwrite'`), store the handle, then sync.
- **Allow** (Library, user click): `requestPermission`, then sync.
- **Sync**: import every note file whose id is not in the index, then write
  every note with `written: false`. Opening the Library syncs automatically
  when the status is `ready`, and so does any note change while it is open.
- **Background save**: after storing a note, the background tries to write
  its file if the folder is `ready`. Any error (including the API not being
  available in the service worker) leaves the note `written: false` for the
  Library to write later. Nothing is ever lost: the index always has the note.
- Firefox has no folder picker: notes stay in the extension and the Library
  hides the folder controls.

## 3. Saving from the sidebar

- `useAnswer.start` also records `analysisKey` and `analysis` for the answer.
- A **Save** button sits with Copy / Open chat once the answer is `done`
  with content. After saving it reads **Saved** (disabled until the answer
  changes).
- `SAVE_NOTE` message (sidebar → background) carries videoId, title, channel,
  analysisKey, analysis, provider and nodes. The background validates every
  field (video id pattern, string length caps, provider, answer nodes through
  the existing parser), builds id / url / fileName / savedAt, stores the note,
  tries to write the file and replies `written` · `pending` · `no-folder`, or
  an error.
- Notices: `pending` → "Saved. Open the Library and click Allow to write it to
  your folder." `no-folder` → "Saved. Choose a folder in the Library to keep
  it as a file." Error → "Couldn't save the note."
- A book icon in the sidebar header (and a button in the toolbar popup) sends
  `OPEN_LIBRARY`: the background focuses an open Library tab or opens one.

## 4. Library page (`src/entrypoints/library/`, opened as `library.html`)

Same tokens, components and i18n as the sidebar. From top to bottom:

1. **Header**: title, folder status with **Choose folder** / **Allow** /
   folder name with **Change**, and "N notes waiting to be written" when any
   are pending.
2. **Ask AI**: AI picker (existing `ProviderSelect`), question box, **Ask**,
   and "Sends N of M notes". Sends the notes the search shows (all when the
   search is empty), newest first, until 150,000 characters. The answer
   appears under the box exactly like the sidebar answer (same streaming via
   the AI tab, also a private chat), with citations turned into links.
3. **Search**: filters by title, channel, analysis and answer text.
4. **Notes**, newest first: title (link to the video), channel · date ·
   analysis · AI, the answer with every time as a link to that moment, and
   **Delete** (confirm first; removes the file too, asking for folder access
   if needed).

### Ask AI prompt (`buildLibraryPrompt`)

Notes are numbered `N1…Nk`, each with title, channel, date, analysis and its
Markdown (plain `m:ss` times), inside `<notes>`. Then the question and: start
with a direct answer in 1–3 sentences, then up to 6 supporting points, one
line each, each citing its note and time as `[N3 4:05]` (or `[N3]` when no
time fits); say so when the notes don't cover it; answer-language line as
today.

`splitCitations` turns `[N3 4:05]`, `[N3, 4:05]`, `[N3 @ 4:05]` and `[N3]`
into links ("Video title · 4:05" → the video at that second). Unknown note
numbers stay plain text.

### Answer delivery to an extension page

The job remembers whether the asking tab is an extension page. If it is, the
background delivers `AI_ANSWER` with `runtime.sendMessage` (extension pages do
not receive `tabs.sendMessage`); `useAnswer` already filters by request id.
Bringing the asking tab back to the front after sending works as today.

## Errors

| Case | Result |
| --- | --- |
| Invalid save payload | Nothing stored, "Couldn't save the note." |
| No folder / no permission | Note stored, notice says how to get the file |
| Folder moved or deleted | Library shows "Folder not found" + Choose folder |
| Write fails during sync | Note stays pending, count shown in the header |
| Import: foreign, invalid or >1 MB file | Skipped; "Imported N notes, skipped M files" |
| Ask AI with no notes | Ask disabled, hint to save notes first |

## Tests

Add Vitest (pinned, dev only) with WXT's `WxtVitest` plugin and a `test`
script; `npm run check` also runs it. Covered:

- note → file → note round trip (titles with quotes/colons, nested lists,
  bold/italic, times in brackets and bare)
- file-name cleaning, length cap and duplicate suffix
- note id for presets and questions
- `parseNoteFile` rejects foreign, malformed and oversized files
- `SAVE_NOTE` payload validation
- `buildLibraryPrompt` numbering and the character cap
- `splitCitations` variants and unknown note numbers

Manual (logged-in Chrome): private chat URLs; choose folder, save, file
appears; restart Chrome → Allow → pending notes written; remove and re-add
the extension → Choose folder imports the notes; Ask AI with citations.

## Out of scope

Chatting inside the sidebar, cloud sync, tags, editing notes, folder support
in Firefox.
