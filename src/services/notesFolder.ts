import type { SavedNote } from '@/types';
import {
  listNotes,
  markAllUnwritten,
  markWritten,
  putNote,
  removeNote,
} from '@/services/notesStore';
import {
  MAX_NOTE_FILE_CHARS,
  isOwnNoteFile,
  noteToFile,
  parseNoteFile,
  uniqueFileName,
} from '@/utils/notes';

/**
 * The folder the user picked for note files (File System Access API, Chrome
 * only). Its handle is kept in the extension's own IndexedDB. Chrome can
 * forget the permission (e.g. after a restart): the Library then asks again
 * with one click, and notes saved meanwhile wait in storage until then.
 *
 * Files are only ever overwritten or deleted when their header says they
 * are the same note; other files in the folder are left alone.
 */

export type FolderStatus =
  | { state: 'unsupported' }
  | { state: 'none' }
  | { state: 'needs-permission' | 'missing' | 'ready'; name: string };

export interface SyncResult {
  imported: number;
  /** Note files of ours that could not be read */
  skipped: number;
  written: number;
  failed: number;
}

type ReadWrite = { mode: 'readwrite' };

/** Parts of the API that TypeScript's DOM types don't include yet. */
interface DirectoryExtras {
  queryPermission?: (descriptor: ReadWrite) => Promise<PermissionState>;
  requestPermission?: (descriptor: ReadWrite) => Promise<PermissionState>;
  values?: () => AsyncIterable<FileSystemHandle>;
}

type DirectoryPicker = (options: {
  id: string;
  mode: 'readwrite';
}) => Promise<FileSystemDirectoryHandle>;

const DB_NAME = 'youtube-script';
const DB_STORE = 'handles';
const FOLDER_KEY = 'notes-folder';
const READ_WRITE: ReadWrite = Object.freeze({ mode: 'readwrite' });
/** Enough of a file to find its header */
const HEADER_BYTES = 4096;
/** UTF-8 uses at most 4 bytes per character */
const MAX_NOTE_FILE_BYTES = MAX_NOTE_FILE_CHARS * 4;
const RENAME_ATTEMPTS = 3;

const extras = (dir: FileSystemDirectoryHandle) =>
  dir as unknown as DirectoryExtras;

function errorName(error: unknown): string {
  return error instanceof DOMException ? error.name : '';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function inStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(DB_STORE, mode);
      const request = run(transaction.objectStore(DB_STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

async function loadFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (
    typeof indexedDB === 'undefined' ||
    typeof FileSystemDirectoryHandle === 'undefined'
  ) {
    return null;
  }
  const value: unknown = await inStore('readonly', (store) =>
    store.get(FOLDER_KEY)
  );
  return value instanceof FileSystemDirectoryHandle ? value : null;
}

async function hasPermission(dir: FileSystemDirectoryHandle): Promise<boolean> {
  const query = extras(dir).queryPermission;
  return query ? (await query.call(dir, READ_WRITE)) === 'granted' : false;
}

/** False when the folder was moved or deleted. */
async function folderExists(dir: FileSystemDirectoryHandle): Promise<boolean> {
  const values = extras(dir).values;
  if (!values) return true;
  try {
    await values.call(dir)[Symbol.asyncIterator]().next();
    return true;
  } catch (error) {
    if (errorName(error) === 'NotFoundError') return false;
    throw error;
  }
}

async function* files(
  dir: FileSystemDirectoryHandle
): AsyncGenerator<FileSystemFileHandle> {
  const values = extras(dir).values;
  if (!values) return;
  for await (const handle of values.call(dir)) {
    if (handle.kind === 'file') yield handle as FileSystemFileHandle;
  }
}

function picker(): DirectoryPicker | null {
  if (typeof window === 'undefined') return null;
  const pick = (window as unknown as { showDirectoryPicker?: DirectoryPicker })
    .showDirectoryPicker;
  return typeof pick === 'function' ? pick.bind(window) : null;
}

export async function getFolderStatus(): Promise<FolderStatus> {
  if (!picker()) return { state: 'unsupported' };
  const dir = await loadFolder();
  if (!dir) return { state: 'none' };
  const { name } = dir;
  if (!(await hasPermission(dir))) return { state: 'needs-permission', name };
  return (await folderExists(dir))
    ? { state: 'ready', name }
    : { state: 'missing', name };
}

/** Let the user pick the folder. Null when they cancel. Needs a click. */
export async function chooseFolder(): Promise<FolderStatus | null> {
  const pick = picker();
  if (!pick) return { state: 'unsupported' };

  let dir: FileSystemDirectoryHandle;
  try {
    dir = await pick({ id: 'youtube-script-notes', mode: 'readwrite' });
  } catch (error) {
    if (errorName(error) === 'AbortError') return null;
    throw error;
  }

  await inStore('readwrite', (store) => store.put(dir, FOLDER_KEY));
  // A new folder gets every note, not only the ones still waiting
  await markAllUnwritten();
  return getFolderStatus();
}

/** Ask Chrome for access to the folder again. Needs a click. */
export async function allowFolder(): Promise<FolderStatus> {
  const dir = await loadFolder();
  const request = dir ? extras(dir).requestPermission : undefined;
  if (dir && request) await request.call(dir, READ_WRITE);
  return getFolderStatus();
}

/** Text of a file in the folder, or null if there is none by that name. */
async function readText(
  dir: FileSystemDirectoryHandle,
  name: string
): Promise<string | null> {
  try {
    const file = await (await dir.getFileHandle(name)).getFile();
    return file.size > MAX_NOTE_FILE_BYTES ? '' : await file.text();
  } catch (error) {
    if (errorName(error) === 'NotFoundError') return null;
    // A folder with that name, or an unreadable file: not ours to touch
    return '';
  }
}

type WriteResult = 'written' | 'unchanged' | 'name-taken';

async function writeFile(
  dir: FileSystemDirectoryHandle,
  note: SavedNote
): Promise<WriteResult> {
  const existing = await readText(dir, note.fileName);
  if (existing !== null) {
    const current = parseNoteFile(existing, note.fileName);
    // Never overwrite another note or someone else's file
    if (!current || current.id !== note.id) return 'name-taken';
    // Same version (maybe edited by hand): keep the file as it is
    if (current.savedAt >= note.savedAt) return 'unchanged';
  }

  const handle = await dir.getFileHandle(note.fileName, { create: true });
  // Chrome writes to a temporary file and swaps it in on close
  const writable = await handle.createWritable();
  try {
    await writable.write(noteToFile(note));
    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => undefined);
    throw error;
  }
  return 'written';
}

/**
 * Write a note, picking a new file name if its name is taken by something
 * else. Returns the note as written (maybe renamed), or null.
 */
async function writeNote(
  dir: FileSystemDirectoryHandle,
  note: SavedNote,
  taken: Set<string>
): Promise<SavedNote | null> {
  let current = note;
  for (let attempt = 0; attempt < RENAME_ATTEMPTS; attempt++) {
    if ((await writeFile(dir, current)) !== 'name-taken') return current;
    taken.add(current.fileName.toLowerCase());
    current = {
      ...note,
      fileName: uniqueFileName(note.fileName, taken, note.videoId),
    };
  }
  return null;
}

/**
 * For the background, right after a save: write the file if Chrome still
 * allows it. Never throws; anything else leaves the note waiting.
 */
export async function writeNoteIfAllowed(
  note: SavedNote
): Promise<'written' | 'pending' | 'no-folder'> {
  try {
    const dir = await loadFolder();
    if (!dir) return 'no-folder';
    if (!(await hasPermission(dir))) return 'pending';

    const taken = new Set(
      (await listNotes())
        .filter((other) => other.id !== note.id)
        .map((other) => other.fileName.toLowerCase())
    );
    const written = await writeNote(dir, note, taken);
    return written && (await markWritten(written)) ? 'written' : 'pending';
  } catch {
    // e.g. the API is not available in the service worker
    return 'pending';
  }
}

/**
 * Bring the folder and the extension's notes together: optionally read notes
 * from the folder that the extension doesn't have (after reinstalling), then
 * write every note still waiting. Null when the folder can't be used.
 */
export async function syncFolder({
  importFiles,
}: {
  importFiles: boolean;
}): Promise<SyncResult | null> {
  const dir = await loadFolder();
  if (!dir || !(await hasPermission(dir))) return null;

  const result: SyncResult = { imported: 0, skipped: 0, written: 0, failed: 0 };
  const notes = await listNotes();
  const known = new Set(notes.map((note) => note.id));
  const taken = new Set(notes.map((note) => note.fileName.toLowerCase()));

  if (importFiles) {
    for await (const handle of files(dir)) {
      taken.add(handle.name.toLowerCase());
      if (!handle.name.toLowerCase().endsWith('.md')) continue;

      const file = await handle.getFile();
      if (!isOwnNoteFile(await file.slice(0, HEADER_BYTES).text())) continue;

      const note =
        file.size <= MAX_NOTE_FILE_BYTES
          ? parseNoteFile(await file.text(), handle.name)
          : null;
      if (!note) {
        result.skipped += 1;
        continue;
      }
      // The extension's copy wins over the file
      if (known.has(note.id)) continue;
      await putNote(note);
      known.add(note.id);
      result.imported += 1;
    }
  }

  for (const note of notes.filter((saved) => !saved.written)) {
    try {
      const written = await writeNote(dir, note, taken);
      if (!written) {
        result.failed += 1;
      } else if (await markWritten(written)) {
        result.written += 1;
      }
    } catch {
      result.failed += 1;
    }
  }
  return result;
}

/**
 * Delete a note and its file. The file goes only if its header names this
 * note. 'needs-permission' when Chrome refused access to the folder: then
 * nothing is deleted, or the note would come back from its file.
 */
export async function deleteNote(
  note: SavedNote
): Promise<'deleted' | 'needs-permission'> {
  let status = await getFolderStatus();
  if (status.state === 'needs-permission') status = await allowFolder();
  if (status.state === 'needs-permission') return 'needs-permission';

  const dir = status.state === 'ready' ? await loadFolder() : null;
  if (dir) {
    const text = await readText(dir, note.fileName);
    if (text && parseNoteFile(text, note.fileName)?.id === note.id) {
      await dir.removeEntry(note.fileName);
    }
  }
  await removeNote(note.id);
  return 'deleted';
}
