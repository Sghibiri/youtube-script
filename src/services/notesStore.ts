import type { SavedNote } from '@/types';
import {
  NOTE_KEY_PREFIX,
  isSavedNote,
  noteKey,
  sortNotes,
} from '@/utils/notes';

/**
 * The extension's copy of every saved note, in storage.local. One key per
 * note, so saves from several tabs never overwrite each other. The folder
 * files are written from this copy; it is also what the Library searches.
 */

export async function listNotes(): Promise<SavedNote[]> {
  const all = await browser.storage.local.get(null);
  const notes = Object.entries(all)
    .filter(([key]) => key.startsWith(NOTE_KEY_PREFIX))
    .map(([, value]) => value)
    .filter(isSavedNote);
  return sortNotes(notes);
}

export async function getNote(id: string): Promise<SavedNote | null> {
  const key = noteKey(id);
  const stored = await browser.storage.local.get(key);
  const value: unknown = stored[key];
  return isSavedNote(value) ? value : null;
}

export async function putNote(note: SavedNote): Promise<void> {
  await browser.storage.local.set({ [noteKey(note.id)]: note });
}

export async function removeNote(id: string): Promise<void> {
  await browser.storage.local.remove(noteKey(id));
}

/**
 * Mark a note as written to its file, unless it was saved again meanwhile
 * (then the newer version still has to be written).
 */
export async function markWritten(note: SavedNote): Promise<boolean> {
  const current = await getNote(note.id);
  if (!current || current.savedAt !== note.savedAt) return false;
  if (!current.written || current.fileName !== note.fileName) {
    await putNote({ ...current, fileName: note.fileName, written: true });
  }
  return true;
}

/** After choosing a new folder: every note needs its file written there. */
export async function markAllUnwritten(): Promise<void> {
  const notes = await listNotes();
  const changes = Object.fromEntries(
    notes
      .filter((note) => note.written)
      .map((note) => [noteKey(note.id), { ...note, written: false }])
  );
  if (Object.keys(changes).length > 0) {
    await browser.storage.local.set(changes);
  }
}

/** Call `onChange` whenever a note is added, changed or removed. */
export function watchNotes(onChange: () => void): () => void {
  const listener = (changes: Record<string, unknown>, area: string): void => {
    if (
      area === 'local' &&
      Object.keys(changes).some((key) => key.startsWith(NOTE_KEY_PREFIX))
    ) {
      onChange();
    }
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
