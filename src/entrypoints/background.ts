import type { Message, OpenAIResult, SavedNote, SaveNoteResult } from '@/types';
import {
  PROVIDER_INFO,
  chatUrl,
  isProvider,
  wantsTemporaryChat,
} from '@/utils/providers';
import { isRequestId, parseAnswerUpdate } from '@/utils/answer';
import {
  noteFileName,
  noteId,
  parseSaveNotePayload,
  uniqueFileName,
} from '@/utils/notes';
import { getNote, listNotes, putNote } from '@/services/notesStore';
import { writeNoteIfAllowed } from '@/services/notesFolder';

/**
 * One ChatGPT / Claude tab opened by the extension. Stored in
 * storage.session so it survives the service worker being stopped.
 */
interface Job {
  requestId: string;
  /** Prompt still waiting for the AI tab to pick it up */
  text?: string;
  /** YouTube tab (or Library page) that shows the answer */
  sourceTabId?: number;
  /** The asking tab is an extension page, which tabs.sendMessage can't reach */
  sourceIsExtension?: boolean;

  createdAt: number;
}

const HANDOFF_TTL_MS = 5 * 60 * 1000;
// storage.session holds 10 MB; a 3-hour transcript is ~200 KB.
const MAX_HANDOFF_CHARS = 2_000_000;

const JOB_PREFIX = 'job:';
const jobKey = (aiTabId: number) => `${JOB_PREFIX}${aiTabId}`;

function isMessage(value: unknown): value is Message {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { type?: unknown }).type === 'string'
  );
}

async function readJob(aiTabId: number): Promise<Job | null> {
  const key = jobKey(aiTabId);
  const stored = await browser.storage.session.get(key);
  return (stored[key] as Job | undefined) ?? null;
}

async function writeJob(aiTabId: number, job: Job): Promise<void> {
  await browser.storage.session.set({ [jobKey(aiTabId)]: job });
}

async function removeJob(aiTabId: number): Promise<void> {
  await browser.storage.session.remove(jobKey(aiTabId));
}

function hasFreshPrompt(job: Job | null): job is Job & { text: string } {
  return (
    typeof job?.text === 'string' &&
    Date.now() - job.createdAt <= HANDOFF_TTL_MS
  );
}

async function openAI(
  payload: unknown,
  sender: chrome.runtime.MessageSender
): Promise<OpenAIResult> {
  const { provider, text, requestId } = (payload ?? {}) as Record<
    string,
    unknown
  >;
  if (!isProvider(provider) || typeof text !== 'string') {
    return { ok: false, error: 'Invalid request' };
  }

  const info = PROVIDER_INFO[provider];
  const canFill = info.autofill && text.length <= MAX_HANDOFF_CHARS;
  const sourceTabId = sender.tab?.id;
  // The answer comes back to the YouTube tab (or Library page) that asked
  const watching =
    canFill && sourceTabId !== undefined && isRequestId(requestId);
  const sourceIsExtension = isExtensionPage(sender.url);
  // Read here so the sidebar and the Library page follow the same choice
  const { preferences } = await browser.storage.local.get('preferences');
  const temporary = wantsTemporaryChat(
    preferences as { temporaryChat?: unknown } | undefined
  );

  // Opened in front: Chrome slows down background tabs, and ChatGPT and
  // Claude can then stop writing halfway. The YouTube tab comes back to the
  // front once the prompt is sent (see SENT below).
  const tab = await browser.tabs.create({
    url: chatUrl(provider, temporary),
    active: true,
    ...(sender.tab
      ? { index: sender.tab.index + 1, openerTabId: sender.tab.id }
      : {}),
  });

  if (canFill && tab.id !== undefined) {
    await writeJob(tab.id, {
      requestId: watching ? requestId : crypto.randomUUID(),
      text,
      ...(watching ? { sourceTabId } : {}),
      ...(watching && sourceIsExtension ? { sourceIsExtension } : {}),
      createdAt: Date.now(),
    });
  }

  return { ok: true, watching };
}

/** Give the prompt to the AI tab once. */
async function claimPrompt(
  aiTabId: number
): Promise<{ text: string | null; requestId: string | null }> {
  const job = await readJob(aiTabId);
  if (!hasFreshPrompt(job)) return { text: null, requestId: null };

  const { text, ...rest } = job;
  if (rest.sourceTabId === undefined) {
    await removeJob(aiTabId);
    return { text, requestId: null };
  }

  // Keep the routing so the answer can be sent back to YouTube
  await writeJob(aiTabId, rest);
  return { text, requestId: rest.requestId };
}

/**
 * Pass an answer update from the AI tab to the YouTube tab that asked.
 * An update without a request ID belongs to this tab's own job (sent before
 * the prompt was taken, e.g. on a login page). Updates keep flowing after
 * "done": if the AI continues, the sidebar shows the rest.
 */
async function forwardAnswer(aiTabId: number, payload: unknown): Promise<void> {
  const job = await readJob(aiTabId);
  if (!job || job.sourceTabId === undefined) return;

  const raw = (payload ?? {}) as Record<string, unknown>;
  const update = parseAnswerUpdate({
    ...raw,
    requestId: raw.requestId ?? job.requestId,
  });
  if (!update || update.requestId !== job.requestId) return;

  // Prompt sent: go back to the video, the answer arrives in the sidebar
  if (update.status === 'sent') {
    await browser.tabs
      .update(job.sourceTabId, { active: true })
      .catch(() => undefined);
  }

  const message = { type: 'AI_ANSWER', payload: update };
  try {
    // Extension pages filter by request id; content scripts get only theirs
    await (job.sourceIsExtension
      ? browser.runtime.sendMessage(message)
      : browser.tabs.sendMessage(job.sourceTabId, message));
  } catch {
    // The asking tab was closed or reloaded; nobody is waiting any more
  }
}

/** Bring the AI tab for a request to the front (only for the tab that asked). */
async function focusAITab(
  payload: unknown,
  sourceTabId: number
): Promise<boolean> {
  const { requestId } = (payload ?? {}) as Record<string, unknown>;
  if (!isRequestId(requestId)) return false;

  const all = await browser.storage.session.get(null);
  for (const [key, value] of Object.entries(all)) {
    if (!key.startsWith(JOB_PREFIX)) continue;
    const job = value as Job;
    if (job.requestId !== requestId || job.sourceTabId !== sourceTabId) {
      continue;
    }

    const aiTabId = Number(key.slice(JOB_PREFIX.length));
    const tab = await browser.tabs.update(aiTabId, { active: true });
    if (tab?.windowId !== undefined) {
      await browser.windows.update(tab.windowId, { focused: true });
    }
    return true;
  }
  return false;
}

const VIDEO_URL = /^https:\/\/(www\.|m\.)?youtube\.com\/(watch\?|shorts\/)/;
const YOUTUBE_URL = /^https:\/\/(www\.|m\.)?youtube\.com\//;
const LIBRARY_PATH = '/library.html';

function isExtensionPage(url: string | undefined): boolean {
  return url?.startsWith(browser.runtime.getURL('/')) ?? false;
}

/**
 * Keep an analysis as a note (replacing the same analysis of the same video)
 * and write its file if the folder can be used right now. Only the sidebar
 * on YouTube saves notes.
 */
async function saveNote(
  payload: unknown,
  sender: chrome.runtime.MessageSender
): Promise<SaveNoteResult> {
  if (!YOUTUBE_URL.test(sender.url ?? sender.tab?.url ?? '')) {
    return { ok: false };
  }
  const input = parseSaveNotePayload(payload);
  if (!input) return { ok: false };

  const { analysisKey, ...fields } = input;
  const id = noteId(input.videoId, analysisKey);
  const savedAt = new Date().toISOString();

  // Keep the file name of an earlier save, so its file is replaced
  let fileName = (await getNote(id))?.fileName;
  if (!fileName) {
    const taken = new Set(
      (await listNotes()).map((note) => note.fileName.toLowerCase())
    );
    fileName = uniqueFileName(
      noteFileName({
        savedAt,
        title: input.title,
        analysis: input.analysis,
        analysisKey,
      }),
      taken,
      input.videoId
    );
  }

  const note: SavedNote = { id, ...fields, savedAt, fileName, written: false };
  await putNote(note);
  return { ok: true, file: await writeNoteIfAllowed(note) };
}

/** Bring an open Library tab to the front, or open one. */
async function openLibrary(sender: chrome.runtime.MessageSender) {
  const url = browser.runtime.getURL(LIBRARY_PATH);
  const tabs = await browser.tabs.query({});
  const open = tabs.find((tab) => tab.url?.startsWith(url));
  if (open?.id !== undefined) {
    await browser.tabs.update(open.id, { active: true });
    await browser.windows.update(open.windowId, { focused: true });
    return;
  }
  await browser.tabs.create({
    url,
    ...(sender.tab
      ? { index: sender.tab.index + 1, openerTabId: sender.tab.id }
      : {}),
  });
}

/**
 * The toolbar icon opens the sidebar on YouTube videos and Shorts, and shows
 * a short "open a video" note everywhere else.
 */
async function updateAction(tabId: number, url: string | undefined) {
  const onVideo = url !== undefined && VIDEO_URL.test(url);
  await browser.action.setPopup({
    tabId,
    popup: onVideo ? '' : 'popup.html',
  });
}

async function toggleSidebar(tab: chrome.tabs.Tab): Promise<void> {
  if (tab.id === undefined) return;
  try {
    await browser.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' });
  } catch {
    // The page was open before the extension was installed or updated:
    // reloading it loads the sidebar, so do that and open it right away
    await browser.storage.session.set({ [`open:${tab.id}`]: true });
    await browser.tabs.reload(tab.id);
  }
}

export default defineBackground(() => {
  browser.tabs.onUpdated.addListener((tabId, change, tab) => {
    if (change.url !== undefined || change.status === 'loading') {
      void updateAction(tabId, tab.url).catch(() => {
        // Tab closed in the meantime
      });
    }
  });

  browser.action.onClicked.addListener((tab) => {
    void toggleSidebar(tab).catch(() => {
      // Not a page we can reach (e.g. a browser settings page)
    });
  });

  // Tabs already open when the extension starts
  void browser.tabs
    .query({})
    .then((tabs) =>
      Promise.all(
        tabs.map((tab) =>
          tab.id === undefined
            ? undefined
            : updateAction(tab.id, tab.url).catch(() => undefined)
        )
      )
    );

  browser.runtime.onMessage.addListener(
    (
      message: unknown,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: unknown) => void
    ) => {
      if (!isMessage(message) || sender.id !== browser.runtime.id) {
        return false;
      }

      if (message.type === 'OPEN_AI') {
        openAI(message.payload, sender).then(sendResponse, (error: unknown) =>
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : 'Cannot open AI',
          } satisfies OpenAIResult)
        );
        return true;
      }

      if (message.type === 'SAVE_NOTE') {
        saveNote(message.payload, sender).then(sendResponse, () =>
          sendResponse({ ok: false } satisfies SaveNoteResult)
        );
        return true;
      }

      // From the sidebar or the toolbar popup
      if (message.type === 'OPEN_LIBRARY') {
        openLibrary(sender).then(
          () => sendResponse({ ok: true }),
          () => sendResponse({ ok: false })
        );
        return true;
      }

      const tabId = sender.tab?.id;
      if (tabId === undefined) return false;

      switch (message.type) {
        case 'HAS_HANDOFF':
          readJob(tabId).then(
            (job) => sendResponse({ pending: hasFreshPrompt(job) }),
            () => sendResponse({ pending: false })
          );
          return true;

        case 'CLAIM_HANDOFF':
          claimPrompt(tabId).then(sendResponse, () =>
            sendResponse({ text: null, requestId: null })
          );
          return true;

        case 'AI_PROGRESS':
          forwardAnswer(tabId, message.payload).then(
            () => sendResponse({ ok: true }),
            () => sendResponse({ ok: false })
          );
          return true;

        case 'FOCUS_AI_TAB':
          focusAITab(message.payload, tabId).then(
            (ok) => sendResponse({ ok }),
            () => sendResponse({ ok: false })
          );
          return true;

        // Asked once by the sidebar when it loads
        case 'SHOULD_OPEN': {
          const key = `open:${tabId}`;
          browser.storage.session
            .get(key)
            .then(async (stored) => {
              await browser.storage.session.remove(key);
              sendResponse({ open: stored[key] === true });
            })
            .catch(() => sendResponse({ open: false }));
          return true;
        }

        default:
          return false;
      }
    }
  );

  browser.tabs.onRemoved.addListener((tabId) => {
    void (async () => {
      const job = await readJob(tabId);
      if (!job) return;
      // Tell a waiting YouTube tab that this chat tab is gone
      await forwardAnswer(tabId, {
        requestId: job.requestId,
        status: 'failed',
        nodes: [],
        failure: 'no-reply',
      });
      await removeJob(tabId);
    })().catch(() => {
      // Nothing left to clean up
    });
  });
});
