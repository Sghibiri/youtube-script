import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { SavedNote } from '@/types';
import { useI18n } from '@/i18n';
import { listNotes, watchNotes } from '@/services/notesStore';
import {
  allowFolder,
  chooseFolder,
  deleteNote,
  getFolderStatus,
  syncFolder,
  type FolderStatus,
  type SyncResult,
} from '@/services/notesFolder';
import { NoticeBox } from '@/components/Notice';
import { noteSearchText } from '@/utils/library';
import { matchesQuery } from '@/utils/transcript';
import type { SendNotice } from '@/utils/sendNotice';
import appIcon from '@/assets/icons/app-icon.svg';
import { AskPanel } from './AskPanel';
import { FolderBar } from './FolderBar';
import { NoteCard } from './NoteCard';

/** One sync at a time; a request during a sync runs right after it. */
interface SyncQueue {
  running: boolean;
  again: boolean;
  importAgain: boolean;
}

export default function App() {
  const { t, formatString, language } = useI18n();
  const [notes, setNotes] = useState<SavedNote[] | null>(null);
  const [folder, setFolder] = useState<FolderStatus | null>(null);
  const [folderBusy, setFolderBusy] = useState(false);
  const [notice, setNotice] = useState<SendNotice | null>(null);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const queue = useRef<SyncQueue>({
    running: false,
    again: false,
    importAgain: false,
  });

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = `${t.libraryTitle} · ${t.appTitle}`;
  }, [language, t]);

  // The notes, kept current when the sidebar saves one or a sync changes them
  useEffect(() => {
    let active = true;
    const load = () =>
      listNotes().then(
        (list) => active && setNotes(list),
        () => active && setNotes([])
      );
    void load();
    const stop = watchNotes(() => void load());
    return () => {
      active = false;
      stop();
    };
  }, []);

  const describeSync = useCallback(
    (result: SyncResult): SendNotice | null => {
      const lines = [
        result.imported > 0 &&
          formatString(t.syncImported, { count: String(result.imported) }),
        result.skipped > 0 &&
          formatString(t.syncSkipped, { count: String(result.skipped) }),
        result.failed > 0 &&
          formatString(t.syncFailed, { count: String(result.failed) }),
      ].filter((line): line is string => typeof line === 'string');
      if (lines.length === 0) return null;
      return {
        kind: result.failed > 0 || result.skipped > 0 ? 'error' : 'success',
        text: lines.join(' '),
      };
    },
    [formatString, t]
  );

  const refreshFolder = useCallback(async () => {
    try {
      setFolder(await getFolderStatus());
    } catch {
      setFolder({ state: 'none' });
    }
  }, []);

  /** Import notes from the folder (optional) and write the waiting ones. */
  const runSync = useCallback(
    async (importFiles: boolean) => {
      const state = queue.current;
      if (state.running) {
        state.again = true;
        state.importAgain ||= importFiles;
        return;
      }
      state.running = true;
      let withImport = importFiles;
      try {
        for (;;) {
          state.again = false;
          state.importAgain = false;
          const result = await syncFolder({ importFiles: withImport });
          const message = result ? describeSync(result) : null;
          if (message) setNotice(message);
          if (!state.again) break;
          withImport = state.importAgain;
        }
      } catch {
        setNotice({ kind: 'error', text: t.errorFolder });
      } finally {
        state.running = false;
        await refreshFolder();
      }
    },
    [describeSync, refreshFolder, t]
  );

  // On opening: where the folder stands, and bring it up to date
  useEffect(() => {
    void (async () => {
      const status = await getFolderStatus().catch(
        (): FolderStatus => ({ state: 'none' })
      );
      setFolder(status);
      if (status.state === 'ready') await runSync(true);
    })();
    // Once per page load
  }, []);

  // Notes saved while the Library is open go to the folder right away
  const pending = notes?.filter((note) => !note.written).length ?? 0;
  const folderState = folder?.state;
  useEffect(() => {
    if (folderState === 'ready' && pending > 0) void runSync(false);
  }, [folderState, pending, runSync]);

  const runFolderAction = async (
    action: () => Promise<FolderStatus | null>
  ) => {
    setFolderBusy(true);
    setNotice(null);
    try {
      const status = await action();
      if (status) {
        setFolder(status);
        if (status.state === 'ready') await runSync(true);
      }
    } catch {
      setNotice({ kind: 'error', text: t.errorFolder });
    } finally {
      setFolderBusy(false);
    }
  };

  const removeNote = async (note: SavedNote): Promise<boolean> => {
    try {
      if ((await deleteNote(note)) === 'deleted') return true;
    } catch {
      // Reported below
    }
    setNotice({ kind: 'error', text: t.errorDelete });
    await refreshFolder();
    return false;
  };

  const searchTexts = useMemo(
    () => new Map((notes ?? []).map((note) => [note.id, noteSearchText(note)])),
    [notes]
  );
  const visible = useMemo(
    () =>
      (notes ?? []).filter((note) =>
        matchesQuery(searchTexts.get(note.id) ?? '', deferredQuery)
      ),
    [notes, searchTexts, deferredQuery]
  );
  const searching = deferredQuery.trim() !== '';

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] font-sans text-[var(--color-text-primary)]">
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-8">
        <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex items-center gap-3">
            <img src={appIcon} alt="" className="h-8 w-8 shrink-0" />
            <div>
              <h1 className="m-0 text-xl font-semibold leading-tight">
                {t.libraryTitle}
              </h1>
              {notes && (
                <p className="m-0 text-xs text-[var(--color-text-secondary)]">
                  {formatString(t.noteCount, { count: String(notes.length) })}
                </p>
              )}
            </div>
          </div>
          <div className="ml-auto min-w-0">
            <FolderBar
              status={folder}
              pending={pending}
              busy={folderBusy}
              onChoose={() => void runFolderAction(chooseFolder)}
              onAllow={() => void runFolderAction(allowFolder)}
            />
          </div>
        </header>

        {notice && <NoticeBox kind={notice.kind}>{notice.text}</NoticeBox>}

        {notes && notes.length === 0 && (
          <p className="m-0 py-6 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
            {t.notesEmpty}
          </p>
        )}

        {notes && notes.length > 0 && (
          <>
            <AskPanel notes={visible} total={notes.length} />

            <section aria-label={t.searchNotes} className="flex flex-col">
              <div className="flex items-center gap-2">
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.searchNotes}
                  aria-label={t.searchNotes}
                  className="h-8 min-w-0 flex-1 rounded-md border border-solid border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-2.5 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-primary focus:outline-none"
                />
                {searching && (
                  <span
                    role="status"
                    className="shrink-0 text-xs text-[var(--color-text-secondary)]"
                  >
                    {visible.length > 0
                      ? formatString(t.matchCount, {
                          count: String(visible.length),
                        })
                      : t.noMatches}
                  </span>
                )}
              </div>

              <div className="mt-1">
                {visible.map((note) => (
                  <NoteCard key={note.id} note={note} onDelete={removeNote} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
