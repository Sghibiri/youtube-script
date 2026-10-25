/**
 * Runs on chatgpt.com and claude.ai. When the extension opened this tab with
 * a prompt waiting, it fills the chat box and sends it, so the analysis runs
 * on the user's own ChatGPT / Claude subscription (no API key needed).
 * When a YouTube tab is waiting, it then reads the reply as it is written
 * and sends it back to show next to the video.
 *
 * If anything here fails, the prompt is still on the clipboard: paste it.
 * Both sites change their page structure often, so every element is found
 * through a list of known variants.
 */
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import type { AnswerFailure, AnswerNode, AnswerStatus } from '@/types';
import { readAnswer } from '@/utils/readAnswer';

interface SiteConfig {
  composer: readonly string[];
  send: readonly string[];
  /** The assistant's reply, most specific first */
  reply: readonly string[];
  /** Visible while the reply is still being written */
  generating: readonly string[];
}

const SITES: Readonly<Record<string, SiteConfig>> = Object.freeze({
  'chatgpt.com': {
    composer: [
      '#prompt-textarea',
      'div.ProseMirror[contenteditable="true"]',
      'form [contenteditable="true"][role="textbox"]',
      'form [contenteditable="true"]',
      'form textarea',
    ],
    send: [
      'button[data-testid="send-button"]',
      'button#composer-submit-button',
      'button[aria-label="Send prompt" i]',
      'form button[aria-label*="send" i]',
    ],
    reply: [
      '[data-message-author-role="assistant"]',
      '[data-message-role="assistant"]',
      '[data-content-search-unit-key$=":assistant"]',
      '[class*="MarkdownRoot-"]',
      '.markdown',
    ],
    generating: [
      'button[data-testid="stop-button"]',
      'button[aria-label*="stop" i]',
    ],
  },
  'claude.ai': {
    composer: [
      'div.ProseMirror[contenteditable="true"]',
      'div[data-placeholder][contenteditable="true"]',
      '[contenteditable="true"][role="textbox"]',
    ],
    send: [
      'button[aria-label="Send message" i]',
      'button[aria-label*="send" i]',
      'button[data-testid="send-button"]',
    ],
    reply: [
      '.font-claude-response',
      '[data-is-streaming]',
      '.font-claude-message',
    ],
    generating: ['[data-is-streaming="true"]', 'button[aria-label*="stop" i]'],
  },
});

const POLL_MS = 250;
// Long enough for a Cloudflare check or a slow first load
const COMPOSER_TIMEOUT_MS = 45_000;
// Let the app finish hydrating before typing into it
const SETTLE_MS = 700;
// Long pastes become attachments; give them time to process
const SEND_TIMEOUT_MS = 15_000;
const SENT_CHECK_MS = 8_000;

const WATCH_MS = 700;
// Quiet time before the reply counts as finished. Long, because the AI can
// pause mid-answer (web search, thinking) and the sites' "still working"
// markers change often. Later text still updates the sidebar (see below).
const STABLE_MS = 10_000;
// After the reply settles, keep reading for a while in case it continues
const LATE_UPDATE_MS = 2 * 60 * 1000;
// Thinking models can take a while before the first word
const FIRST_TEXT_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_WATCH_MS = 15 * 60 * 1000;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function isVisible(element: Element): boolean {
  return element.getClientRects().length > 0;
}

function findVisible<T extends Element>(
  selectors: readonly string[],
  accept: (element: T) => boolean = () => true
): T | null {
  for (const selector of selectors) {
    for (const element of document.querySelectorAll<T>(selector)) {
      if (isVisible(element) && accept(element)) return element;
    }
  }
  return null;
}

function findComposer(site: SiteConfig): HTMLElement | null {
  return findVisible<HTMLElement>(site.composer);
}

function findSendButton(site: SiteConfig): HTMLButtonElement | null {
  return findVisible<HTMLButtonElement>(
    site.send,
    (button) =>
      !button.disabled && button.getAttribute('aria-disabled') !== 'true'
  );
}

function isGenerating(site: SiteConfig): boolean {
  return findVisible(site.generating) !== null;
}

function composerText(composer: HTMLElement): string {
  return composer instanceof HTMLTextAreaElement
    ? composer.value
    : (composer.textContent ?? '');
}

/** How many replies each selector matches, to spot the new one later. */
function countReplies(site: SiteConfig): Map<string, number> {
  return new Map(
    site.reply.map((selector) => [
      selector,
      document.querySelectorAll(selector).length,
    ])
  );
}

/**
 * Everything written after we sent the prompt. A reply can be split into
 * several blocks (e.g. text, a web search, then more text), so all new
 * blocks count, not just the last one. Empty list until the reply starts.
 */
function findNewReplies(
  site: SiteConfig,
  before: ReadonlyMap<string, number>
): Element[] {
  for (const selector of site.reply) {
    const matches = Array.from(document.querySelectorAll(selector));
    const fresh = matches.slice(before.get(selector) ?? 0);
    if (fresh.length > 0) {
      // A block nested in another new block would be read twice
      return fresh.filter(
        (element) =>
          !fresh.some((other) => other !== element && other.contains(element))
      );
    }
  }
  return [];
}

function readReplies(replies: readonly Element[]): AnswerNode[] {
  return replies.flatMap((reply) => readAnswer(reply));
}

async function waitFor<T>(
  ctx: ContentScriptContext,
  find: () => T | null,
  timeoutMs: number
): Promise<T | null> {
  const deadline = Date.now() + timeoutMs;
  while (!ctx.isInvalid && Date.now() < deadline) {
    const found = find();
    if (found) return found;
    await sleep(POLL_MS);
  }
  return null;
}

async function ask(message: {
  type: string;
  payload?: unknown;
}): Promise<unknown> {
  try {
    return await browser.runtime.sendMessage(message);
  } catch {
    // Extension was reloaded or updated; nothing to do
    return null;
  }
}

/**
 * Tell the waiting YouTube tab how it is going. Without a request ID the
 * background fills in the one for this tab (used before the prompt is taken).
 */
function report(
  requestId: string | null,
  status: AnswerStatus,
  nodes: AnswerNode[] = [],
  failure?: AnswerFailure
): Promise<unknown> {
  return ask({
    type: 'AI_PROGRESS',
    payload: {
      ...(requestId ? { requestId } : {}),
      status,
      nodes,
      ...(failure ? { failure } : {}),
    },
  });
}

/**
 * Insert text the way a real paste would, so the site's own paste handling
 * (e.g. turning long text into an attachment) kicks in.
 */
function insertText(composer: HTMLElement, text: string): boolean {
  composer.focus();

  if (composer instanceof HTMLTextAreaElement) {
    composer.value = text;
    composer.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }

  const clipboardData = new DataTransfer();
  clipboardData.setData('text/plain', text);
  const paste = new ClipboardEvent('paste', {
    clipboardData,
    bubbles: true,
    cancelable: true,
  });

  // The editor cancels the event when it handled the paste itself
  const handled = !composer.dispatchEvent(paste);
  if (handled) return true;

  return document.execCommand('insertText', false, text);
}

function pressEnter(composer: HTMLElement): void {
  composer.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      bubbles: true,
      cancelable: true,
    })
  );
}

/** Read the reply as it is written and pass it on until it is finished. */
async function watchReply(
  ctx: ContentScriptContext,
  site: SiteConfig,
  requestId: string,
  before: ReadonlyMap<string, number>
): Promise<void> {
  const startedAt = Date.now();
  let nodes: AnswerNode[] = [];
  let lastKey = '';
  let lastChange = startedAt;
  let doneAt: number | null = null;

  while (!ctx.isInvalid) {
    await sleep(WATCH_MS);
    const now = Date.now();

    const next = readReplies(findNewReplies(site, before));
    const key = JSON.stringify(next);
    if (next.length > 0 && key !== lastKey) {
      nodes = next;
      lastKey = key;
      lastChange = now;
      // Text after "done" (the AI continued): update, and settle again
      doneAt = null;
      await report(requestId, 'writing', nodes);
    }

    if (doneAt !== null) {
      if (now - doneAt > LATE_UPDATE_MS) return;
      continue;
    }

    const settled = now - lastChange >= STABLE_MS && !isGenerating(site);
    if (nodes.length > 0 && (settled || now - startedAt > MAX_WATCH_MS)) {
      await report(requestId, 'done', nodes);
      doneAt = now;
      continue;
    }
    if (nodes.length === 0 && now - startedAt > FIRST_TEXT_TIMEOUT_MS) {
      await report(requestId, 'failed', [], 'no-reply');
      return;
    }
  }
}

export default defineContentScript({
  matches: ['https://chatgpt.com/*', 'https://claude.ai/*'],
  runAt: 'document_idle',

  async main(ctx) {
    const site = SITES[window.location.hostname];
    if (!site) return;

    // Cheap check first so normal visits to these sites do nothing
    const status = (await ask({ type: 'HAS_HANDOFF' })) as {
      pending?: boolean;
    } | null;
    if (!status?.pending) return;

    // Only take the prompt once the chat box exists (not on a login page).
    // The prompt stays waiting, so after logging in it is sent after all.
    const ready = await waitFor(
      ctx,
      () => findComposer(site),
      COMPOSER_TIMEOUT_MS
    );
    if (ctx.isInvalid) return;
    if (!ready) {
      console.warn('[YT Script] Chat box not found; paste the prompt manually');
      await report(null, 'failed', [], 'composer');
      return;
    }
    await sleep(SETTLE_MS);

    const composer = findComposer(site);
    if (!composer || ctx.isInvalid) return;

    const claim = (await ask({ type: 'CLAIM_HANDOFF' })) as {
      text?: unknown;
      requestId?: unknown;
    } | null;
    if (typeof claim?.text !== 'string' || claim.text === '') return;
    const requestId =
      typeof claim.requestId === 'string' ? claim.requestId : null;

    if (!insertText(composer, claim.text)) {
      console.warn(
        '[YT Script] Could not fill the chat box; paste the prompt manually'
      );
      if (requestId) await report(requestId, 'failed', [], 'composer');
      return;
    }

    const before = countReplies(site);
    const sendButton = await waitFor(
      ctx,
      () => findSendButton(site),
      SEND_TIMEOUT_MS
    );
    if (ctx.isInvalid) return;
    if (sendButton) {
      sendButton.click();
    } else {
      pressEnter(composer);
    }

    // Sent once the chat box empties or the reply starts
    const sent = await waitFor(
      ctx,
      () =>
        composerText(composer).trim() === '' ||
        !composer.isConnected ||
        isGenerating(site) ||
        findNewReplies(site, before).length > 0 ||
        null,
      SENT_CHECK_MS
    );
    if (ctx.isInvalid || !requestId) return;
    if (!sent) {
      await report(requestId, 'failed', [], 'send');
      return;
    }

    await report(requestId, 'sent');
    await watchReply(ctx, site, requestId, before);
  },
});
