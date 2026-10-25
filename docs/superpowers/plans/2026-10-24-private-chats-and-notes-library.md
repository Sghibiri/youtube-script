# Private chats and notes library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Private ChatGPT / Claude chats by default, a Save button that keeps an
analysis as a Markdown note in a user-picked folder, and a Library page to
search notes and ask an AI across them.

**Architecture:** Pure note logic (ids, file format, prompt, citations) lives
in `src/utils/notes*.ts` and is unit-tested. The background validates and
stores notes in `chrome.storage.local` and tries to write the file; the
Library page owns the folder (File System Access API) and syncs pending notes.
The existing AI hand-off and answer streaming are reused for Ask AI.

**Tech Stack:** WXT 0.20, React 19, TypeScript, Tailwind 3, Vitest (new, dev).

Spec: `docs/superpowers/specs/2026-10-24-private-chats-and-notes-library-design.md`

Host rules: no commits (the user commits), no other new dependencies.
Inline execution: code is written straight into the files below rather than
copied into this plan first; every task ends with `npm test` and/or
`npm run compile`.

---

## File map

| File | Responsibility |
| --- | --- |
| `src/utils/providers.ts` (modify) | Private chat URLs |
| `src/types/index.ts` (modify) | `SavedNote`, `SaveNotePayload`, `SaveNoteResult`, new message types, `TranscriptData.channel` |
| `src/utils/answer.ts` (modify) | Export `parseAnswerNodes` (validated nodes) |
| `src/utils/notes.ts` (create) | Note ids, file names, payload validation, note ⇄ Markdown file |
| `src/utils/markdown.ts` (create) | Markdown (our subset) → `AnswerNode[]` |
| `src/utils/library.ts` (create) | `buildLibraryPrompt`, `splitCitations`, note search |
| `src/services/notesStore.ts` (create) | `chrome.storage.local` index: list, get, put, remove, watch |
| `src/services/notesFolder.ts` (create) | Folder handle (IndexedDB), status, choose/allow, write, delete, import, sync |
| `src/entrypoints/background.ts` (modify) | `SAVE_NOTE`, `OPEN_LIBRARY`, answer delivery to extension pages |
| `src/services/llmService.ts` (modify) | `saveNote`, `openLibrary` helpers |
| `src/services/youtubeService.ts` (modify) | Channel name from `videoDetails.author` |
| `src/entrypoints/youtube-sidebar.content/useAnswer.ts` (modify) | Remember `analysisKey` / `analysis` |
| `src/entrypoints/youtube-sidebar.content/App.tsx` (modify) | Save button, library icon |
| `src/entrypoints/youtube-sidebar.content/AnswerPanel.tsx` (modify) | Export `AnswerNodes`; optional time links and citations in `RenderContext` |
| `src/components/icons.tsx` (modify) | `BookIcon` |
| `src/entrypoints/library/{index.html,main.tsx,App.tsx,NoteCard.tsx,AskPanel.tsx,FolderBar.tsx}` (create) | Library page |
| `src/entrypoints/popup/App.tsx` (modify) | "Open library" button |
| `src/i18n/types.ts`, `src/i18n/translations/*.ts` (modify) | New strings + library prompt, all 5 languages |
| `wxt.config.ts` (modify) | `unlimitedStorage` |
| `vitest.config.ts`, `package.json` (create/modify) | Vitest + `test` script, `check` runs tests |
| `src/**/*.test.ts` (create) | Unit tests |
| `README.md` (modify) | Private chats, Save, Library |

## Tasks

### Task 1: Vitest
- [ ] Install `vitest` pinned (exact version, `-D`), add `"test": "vitest run"`, add `npm run test` to `check`.
- [ ] `vitest.config.ts` with `WxtVitest()` from `wxt/testing/vitest-plugin` so `@/` aliases and `browser` (fake) work.
- [ ] Run `npm test` → "No test files found" (exit code accepted until Task 3 adds tests; use `--passWithNoTests` only for this check).

### Task 2: Private chats
- [ ] `providers.ts`: `https://chatgpt.com/?temporary-chat=true`, `https://claude.ai/new?incognito`.
- [ ] `npm run compile`.

### Task 3: Note ids, file names, validation (`src/utils/notes.ts`) — test first
Tests (`src/utils/notes.test.ts`):
- `analysisKeyFor({ presetId: 'summary' })` → `'summary'`; question → `q-` + 8 hex, same for case/space variants.
- `noteFileName({ savedAt: '2026-10-24T…', title: 'A: "B"/C?', analysis: 'Key moments' })` → `'2026-10-24 A B C – Key moments.md'`; long titles cut so the base is ≤ 120 chars; question analysis `Q <40 chars>`.
- `uniqueFileName(name, taken, videoId)` adds ` (videoId)` only on clash.
- `parseSaveNotePayload` accepts a valid payload; rejects bad video id, unknown provider, empty nodes, over-long strings, bad analysisKey.
Then implement; `npm test` passes.

### Task 4: Markdown file ⇄ note — test first
Tests (`src/utils/notes.test.ts`, `src/utils/markdown.test.ts`):
- `noteToFile(note)` front matter has `source: youtube-script` and JSON-quoted values; `[3:03] x` and bare `3:03` become `[3:03](https://www.youtube.com/watch?v=ID&t=183s)`.
- `parseNoteFile(noteToFile(note), fileName)` round-trips id, title (with quotes/colons), url, channel, analysis, provider, savedAt and nodes (headings, paragraphs, nested ordered/unordered lists, quote, code, rule, bold/italic/code inlines), times back to plain `m:ss`.
- Rejects: missing front matter, other `source`, invalid fields, > 1 MB text.
Then implement `src/utils/markdown.ts` (`markdownToNodes`) and the file functions in `notes.ts`; `parseAnswerNodes` exported from `answer.ts` validates the result.

### Task 5: Library prompt, citations, search — test first
Tests (`src/utils/library.test.ts`):
- `buildLibraryPrompt(notes, question, prompts, answerLanguage)` numbers notes N1…, newest first, stops before `maxChars`, returns `{ text, included }`.
- `splitCitations('see [N2 4:05] and [N1]', 2)` → text / citation(note 2, 245 s) / text / citation(note 1); `[N2, 4:05]`, `[N2 @ 4:05]` work; `[N9]` with 2 notes stays text.
- `matchesNote(note, query)` searches title, channel, analysis, answer text.

### Task 6: Store and folder services
- `notesStore.ts`: `listNotes()` (sorted newest first), `getNote(id)`, `putNote(note)`, `removeNote(id)`, `watchNotes(callback)` (storage.onChanged on `note:` keys).
- `notesFolder.ts`: IndexedDB `youtube-script`/`handles`/`folder`; `getFolderStatus()`, `chooseFolder()`, `allowFolder()`, `writeNoteFile(note)`, `deleteNoteFile(fileName)`, `syncFolder()` → `{ imported, skipped, written, failed }`; `writePendingIfReady(note)` for the background (feature-detected, never throws).
- `npm run compile`.

### Task 7: Background
- `SAVE_NOTE`: only from tabs on youtube.com; validate with `parseSaveNotePayload`; keep existing `fileName`, else unique new one; `putNote`; `writePendingIfReady`; reply `SaveNoteResult`.
- `OPEN_LIBRARY`: focus an existing `library.html` tab or create one next to the sender.
- Job gets `sourceIsExtension` (sender URL starts with the extension origin); `forwardAnswer` uses `runtime.sendMessage` for those.
- `npm run compile`.

### Task 8: Sidebar
- `TranscriptData.channel` from `videoDetails.author`.
- `useAnswer.start(requestId, provider, videoId, { analysisKey, analysis })`.
- `App.tsx`: Save button (answer `done`, nodes > 0) → `llmService.saveNote`; Saved state per request id; notices for pending / no-folder / error; book icon → `openLibrary`.
- i18n strings in all 5 languages.

### Task 9: Library page
- `index.html` (`manifest.type` none → unlisted page), `main.tsx` (theme from system, I18nProvider), `App.tsx` (state, sync on open and on change when ready), `FolderBar.tsx`, `AskPanel.tsx` (ProviderSelect, question, "Sends N of M notes", `useAnswer`, answer via `AnswerView` with citation links), `NoteCard.tsx` (time links, Delete with confirm).
- `AnswerPanel.tsx`: export nodes renderer; `RenderContext` gains optional `timeHref(seconds)` (render `<a>`) and `citations` (note list for `splitCitations`).
- Popup: "Open library" button.
- i18n strings in all 5 languages.

### Task 10: Docs and checks
- README: private chats, Save, Library, folder access after restart, Firefox note.
- `npm run check` (compile, lint, format, tests) and `npm run build` pass.
- Manual checks for the user (spec "Tests → Manual").
