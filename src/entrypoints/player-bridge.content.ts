/**
 * MAIN world content script: runs in YouTube's own page context so it can
 * reach the player. Talks to the extension's isolated scripts via
 * window.postMessage. It answers two requests:
 *
 * - YT_SCRIPT_GET_PLAYER_RESPONSE: the player's video data (caption list).
 * - YT_SCRIPT_GET_CAPTIONS: captions the YouTube player itself downloaded.
 *   The player's caption requests carry YouTube's proof-of-origin token, so
 *   whenever captions show on screen, their text is available here. This is
 *   the backup for when YouTube blocks every other way of getting them.
 */
import { getActivePlayer } from '@/utils/youtubePage';

const CAPTIONS_PATH = '/api/timedtext';
const MAX_CAPTION_CHARS = 5_000_000;
const MAX_CACHED_VIDEOS = 5;
const CAPTION_WAIT_MS = 6000;
// Pre-roll ads: the player only loads the video's captions afterwards
const AD_WAIT_MS = 45_000;
const AFTER_AD_WAIT_MS = 3000;
const AD_POLL_MS = 500;

interface CapturedCaptions {
  body: string;
  language: string;
}

type Player = HTMLElement & {
  getPlayerResponse?: () => unknown;
  isSubtitlesOn?: () => boolean;
  toggleSubtitles?: () => void;
  getVideoData?: () => { video_id?: string };
};

/** Latest captions the player received, by video ID (most recent last). */
const captured = new Map<string, CapturedCaptions>();
const captureListeners = new Set<(videoId: string) => void>();

/** The video's player, or the Short's on Shorts pages. */
function getPlayer(): Player | null {
  return getActivePlayer() as Player | null;
}

function isCaptionUrl(url: string): boolean {
  return url.includes(CAPTIONS_PATH);
}

function remember(url: string, body: string): void {
  if (!body || body.length > MAX_CAPTION_CHARS) return;

  let parsed: URL;
  try {
    parsed = new URL(url, window.location.href);
  } catch {
    return;
  }
  if (!parsed.pathname.startsWith(CAPTIONS_PATH)) return;

  const videoId = parsed.searchParams.get('v');
  if (!videoId) return;

  captured.delete(videoId);
  captured.set(videoId, {
    body,
    language:
      parsed.searchParams.get('tlang') ?? parsed.searchParams.get('lang') ?? '',
  });
  while (captured.size > MAX_CACHED_VIDEOS) {
    const oldest = captured.keys().next().value;
    if (oldest === undefined) break;
    captured.delete(oldest);
  }
  captureListeners.forEach((listener) => listener(videoId));
}

/**
 * Watch the player's caption downloads without changing them: the page gets
 * exactly the same request and response as before.
 */
function watchCaptionRequests(): void {
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest,
    ...args: Parameters<XMLHttpRequest['open']>
  ) {
    try {
      const url = String(args[1]);
      if (isCaptionUrl(url)) {
        this.addEventListener('load', () => {
          try {
            if (this.responseType === '' || this.responseType === 'text') {
              remember(url, this.responseText);
            } else if (this.responseType === 'json' && this.response) {
              remember(url, JSON.stringify(this.response));
            }
          } catch {
            // Never break the player
          }
        });
      }
    } catch {
      // Never break the player
    }
    return originalOpen.apply(this, args);
  } as typeof XMLHttpRequest.prototype.open;

  const originalFetch = window.fetch;
  window.fetch = function (
    this: typeof globalThis,
    ...args: Parameters<typeof fetch>
  ) {
    const result = originalFetch.apply(this, args);
    try {
      const input = args[0];
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (isCaptionUrl(url)) {
        result
          .then((response) => response.clone().text())
          .then((body) => remember(url, body))
          .catch(() => {
            // The page handles its own errors
          });
      }
    } catch {
      // Never break the player
    }
    return result;
  };
}

function waitForCaptions(videoId: string, timeoutMs: number): Promise<boolean> {
  if (captured.has(videoId)) return Promise.resolve(true);

  return new Promise((resolve) => {
    const listener = (id: string) => {
      if (id === videoId) done(true);
    };
    const timer = setTimeout(() => done(false), timeoutMs);
    function done(found: boolean) {
      clearTimeout(timer);
      captureListeners.delete(listener);
      resolve(found);
    }
    captureListeners.add(listener);
  });
}

function isAdShowing(player: Player): boolean {
  return player.classList.contains('ad-showing');
}

async function waitForAdToEnd(player: Player): Promise<boolean> {
  const deadline = Date.now() + AD_WAIT_MS;
  while (isAdShowing(player)) {
    if (Date.now() > deadline) return false;
    await new Promise((resolve) => setTimeout(resolve, AD_POLL_MS));
  }
  return true;
}

/**
 * Captions for a video. If the player has not downloaded any yet, turn
 * captions on for a moment so it does, then put them back as they were.
 */
async function getCaptions(
  videoId: string,
  allowToggle: boolean
): Promise<CapturedCaptions | null> {
  const cached = captured.get(videoId);
  if (cached || !allowToggle) return cached ?? null;

  const player = getPlayer();
  if (!player || typeof player.toggleSubtitles !== 'function') return null;

  if (isAdShowing(player)) {
    if (!(await waitForAdToEnd(player))) return null;
    // With captions on, the player loads them itself when the video starts
    if (await waitForCaptions(videoId, AFTER_AD_WAIT_MS)) {
      return captured.get(videoId) ?? null;
    }
  }

  if (player.getVideoData?.().video_id !== videoId) return null;

  const wasOn = player.isSubtitlesOn?.() ?? false;
  if (wasOn) {
    // Off and on again makes the player download the track
    player.toggleSubtitles();
  }
  player.toggleSubtitles();

  await waitForCaptions(videoId, CAPTION_WAIT_MS);

  if (!wasOn && player.isSubtitlesOn?.()) player.toggleSubtitles();
  return captured.get(videoId) ?? null;
}

type PlayerResponse = Record<string, unknown> & {
  videoDetails?: { videoId?: unknown };
};

function asPlayerResponse(value: unknown): PlayerResponse | null {
  return typeof value === 'object' && value !== null
    ? (value as PlayerResponse)
    : null;
}

/**
 * Candidates, freshest first. After in-page navigation the
 * ytInitialPlayerResponse global still describes the first video, so every
 * candidate is checked against the requested video ID.
 */
function playerResponseCandidates(): (() => unknown)[] {
  const page = window as unknown as Record<string, unknown>;
  return [
    () => getPlayer()?.getPlayerResponse?.(),
    () => page.ytInitialPlayerResponse,
    () => {
      const ytplayer = page.ytplayer as
        | { config?: { args?: { raw_player_response?: unknown } } }
        | undefined;
      return ytplayer?.config?.args?.raw_player_response;
    },
  ];
}

function extractPlayerResponse(
  videoId: string
): { captions: unknown; videoDetails: unknown } | null {
  for (const candidate of playerResponseCandidates()) {
    try {
      const response = asPlayerResponse(candidate());
      if (response?.videoDetails?.videoId === videoId) {
        return {
          captions: response.captions,
          videoDetails: response.videoDetails,
        };
      }
    } catch (error) {
      console.error('[YT Script] Page extraction error:', error);
    }
  }
  return null;
}

function reply(message: Record<string, unknown>): void {
  window.postMessage(message, window.location.origin);
}

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  world: 'MAIN',
  // Early, so the player's first caption download is seen
  runAt: 'document_start',

  main() {
    watchCaptionRequests();

    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      const request = event.data as {
        type?: unknown;
        videoId?: unknown;
        allowToggle?: unknown;
      } | null;
      if (typeof request?.videoId !== 'string') return;
      const { videoId } = request;

      if (request.type === 'YT_SCRIPT_GET_PLAYER_RESPONSE') {
        reply({
          type: 'YT_SCRIPT_PLAYER_RESPONSE',
          videoId,
          data: extractPlayerResponse(videoId),
        });
        return;
      }

      if (request.type === 'YT_SCRIPT_GET_CAPTIONS') {
        getCaptions(videoId, request.allowToggle === true).then(
          (captions) =>
            reply({ type: 'YT_SCRIPT_CAPTIONS', videoId, data: captions }),
          () => reply({ type: 'YT_SCRIPT_CAPTIONS', videoId, data: null })
        );
      }
    });
  },
});
