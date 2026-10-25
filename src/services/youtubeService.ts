import type { TranscriptData, TranscriptSegment } from '@/types';
import {
  formatTranscriptForAI,
  groupIntoParagraphs,
  normalizeCaptionText,
  parseTimestamp,
} from '@/utils/transcript';
import {
  getActivePlayer,
  getActiveReel,
  isShortsPage,
  isVideoId,
  videoIdFromLocation,
} from '@/utils/youtubePage';

const INNERTUBE_PLAYER_URL =
  'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';

/**
 * Caption links from the web player now need a proof-of-origin token and
 * come back empty without it. YouTube's phone apps still get caption links
 * that work, so those are tried first: Android, then iPhone as a backup.
 */
const APP_CLIENTS = Object.freeze({
  android: Object.freeze({
    clientName: 'ANDROID',
    clientVersion: '20.10.38',
    androidSdkVersion: 30,
  }),
  ios: Object.freeze({
    clientName: 'IOS',
    clientVersion: '20.10.4',
    deviceModel: 'iPhone16,2',
  }),
});

type AppClient = keyof typeof APP_CLIENTS;

const PAGE_BRIDGE_TIMEOUT_MS = 3000;
// Allows for a pre-roll ad, then turning captions on briefly (see the bridge)
const PLAYER_CAPTIONS_TIMEOUT_MS = 60_000;

/**
 * Multiple regex patterns to extract ytInitialPlayerResponse from page HTML.
 * YouTube changes the surrounding code periodically, so we try several patterns.
 */
const YT_PLAYER_RESPONSE_PATTERNS = [
  /ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;\s*(?:var\s+(?:meta|head)|<\/script|\n)/s,
  /ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;/s,
  /var\s+ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;/s,
];

interface CaptionTrack {
  baseUrl: string;
  name?: { simpleText?: string; runs?: { text?: string }[] };
  languageCode: string;
  kind?: string;
}

interface PlayerResponse {
  videoDetails?: { videoId?: string; title?: string; author?: string };
  captions?: {
    playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] };
  };
}

interface Json3Event {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: { utf8?: string }[];
}

interface CaptionResult {
  segments: TranscriptSegment[];
  language: string;
  title?: string;
  channel?: string;
}

/**
 * Sort caption tracks: prefer English, prefer manual over auto-generated (ASR)
 */
function compareTracks(a: CaptionTrack, b: CaptionTrack): number {
  if (a.languageCode === 'en' && b.languageCode !== 'en') return -1;
  if (a.languageCode !== 'en' && b.languageCode === 'en') return 1;
  if (a.kind !== 'asr' && b.kind === 'asr') return -1;
  if (a.kind === 'asr' && b.kind !== 'asr') return 1;
  return 0;
}

function trackLabel(track: CaptionTrack): string {
  const name =
    track.name?.simpleText ??
    track.name?.runs?.map((run) => run.text ?? '').join('');
  return name?.trim() || track.languageCode;
}

function pickTrack(playerResponse: PlayerResponse): CaptionTrack | null {
  const tracks =
    playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks ??
    [];
  const usable = tracks.filter((track) => typeof track.baseUrl === 'string');
  return [...usable].sort(compareTracks)[0] ?? null;
}

/**
 * Safely extract a JSON object string from a larger string starting at a given position.
 * Handles nested braces properly instead of relying on non-greedy regex.
 */
function extractJsonObject(str: string, startIndex: number): string | null {
  if (str[startIndex] !== '{') return null;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIndex; i < str.length; i++) {
    const ch = str[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return str.substring(startIndex, i + 1);
      }
    }
  }
  return null;
}

function parseJson3(body: string): TranscriptSegment[] {
  const data = JSON.parse(body) as { events?: Json3Event[] };
  const segments: TranscriptSegment[] = [];

  for (const event of data.events ?? []) {
    if (!event.segs) continue;
    const text = normalizeCaptionText(
      event.segs.map((seg) => seg.utf8 ?? '').join('')
    );
    if (!text) continue;

    segments.push({
      text,
      start: (event.tStartMs ?? 0) / 1000,
      duration: (event.dDurationMs ?? 0) / 1000,
    });
  }

  return segments;
}

async function fetchTrackSegments(
  track: CaptionTrack
): Promise<TranscriptSegment[]> {
  const url = new URL(track.baseUrl, 'https://www.youtube.com');
  url.searchParams.set('fmt', 'json3');

  const response = await fetch(url, { credentials: 'omit' });
  if (!response.ok) return [];

  // Web caption links without a proof-of-origin token return an empty body
  const body = await response.text();
  return body ? parseJson3(body) : [];
}

async function captionsFromPlayerResponse(
  playerResponse: PlayerResponse | null
): Promise<CaptionResult | null> {
  if (!playerResponse) return null;
  const track = pickTrack(playerResponse);
  if (!track) return null;

  return {
    segments: await fetchTrackSegments(track),
    language: trackLabel(track),
    title: playerResponse.videoDetails?.title,
    channel: playerResponse.videoDetails?.author,
  };
}

/**
 * Service for extracting YouTube video transcripts
 */
export const youtubeService = {
  /**
   * Video ID of the video or Short currently open, or null on other pages
   */
  getVideoId: (): string | null => videoIdFromLocation(window.location),

  /**
   * Get video title from page
   */
  getVideoTitle: (): string => {
    const titleElement = isShortsPage()
      ? getActiveReel()?.querySelector('yt-shorts-video-title-view-model')
      : document.querySelector('h1.ytd-watch-metadata yt-formatted-string');
    return titleElement?.textContent?.trim() || 'Unknown Video';
  },

  getVideoUrl: (videoId: string): string =>
    `https://www.youtube.com/watch?v=${videoId}`,

  /** The YouTube player of the video or Short on screen */
  getPlayer: getActivePlayer,

  getVideoElement: (): HTMLVideoElement | null =>
    getActivePlayer()?.querySelector<HTMLVideoElement>('video') ??
    document.querySelector<HTMLVideoElement>('video'),

  /**
   * Jump the YouTube player to a time and keep playing
   */
  seekTo: (seconds: number): void => {
    const video = youtubeService.getVideoElement();
    if (!video) return;
    video.currentTime = seconds;
    video.play().catch(() => {
      // Autoplay can be blocked; the jump still happened
    });
  },

  /**
   * Fetch the transcript, trying the fastest reliable source first:
   * 1-2. YouTube's Android and iPhone app API  3. the web player data
   * 4. captions the player itself downloads  5. the transcript panel
   */
  fetchTranscript: async (
    videoId: string | null = youtubeService.getVideoId()
  ): Promise<TranscriptData> => {
    if (!isVideoId(videoId)) {
      throw new Error('No video ID found in URL');
    }

    const sources: [string, () => Promise<CaptionResult | null>][] = [
      ['android', () => youtubeService.fetchFromAppClient(videoId, 'android')],
      ['ios', () => youtubeService.fetchFromAppClient(videoId, 'ios')],
      ['web', () => youtubeService.fetchFromWebPlayer(videoId)],
      ['player', () => youtubeService.fetchFromPlayerCaptions(videoId)],
      ['panel', () => youtubeService.fetchFromTranscriptPanel(videoId)],
    ];

    for (const [name, load] of sources) {
      const startedAt = performance.now();
      try {
        const result = await load();
        if (result && result.segments.length > 0) {
          return {
            videoId,
            title: result.title?.trim() || youtubeService.getVideoTitle(),
            videoUrl: youtubeService.getVideoUrl(videoId),
            language: result.language,
            ...(result.channel?.trim()
              ? { channel: result.channel.trim() }
              : {}),
            transcript: formatTranscriptForAI(
              groupIntoParagraphs(result.segments)
            ),
            segments: result.segments,
          };
        }
      } catch (error) {
        const elapsedMs = Math.round(performance.now() - startedAt);
        console.warn(
          `[YT Script] Transcript source "${name}" failed for ${videoId} after ${elapsedMs}ms:`,
          error
        );
      }
    }

    throw new Error('No captions found for this video');
  },

  fetchFromAppClient: async (
    videoId: string,
    client: AppClient
  ): Promise<CaptionResult | null> => {
    const response = await fetch(INNERTUBE_PLAYER_URL, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          client: {
            ...APP_CLIENTS[client],
            hl: document.documentElement.lang || 'en',
          },
        },
        videoId,
      }),
    });
    if (!response.ok) return null;

    const playerResponse = (await response.json()) as PlayerResponse;
    if (playerResponse.videoDetails?.videoId !== videoId) return null;
    return captionsFromPlayerResponse(playerResponse);
  },

  fetchFromWebPlayer: async (
    videoId: string
  ): Promise<CaptionResult | null> => {
    const playerResponse = await youtubeService.getPlayerResponse(videoId);
    return captionsFromPlayerResponse(playerResponse);
  },

  /**
   * Get the player response for a video: from the page (via the MAIN world
   * bridge) or by fetching and parsing the watch page HTML.
   */
  getPlayerResponse: async (
    videoId: string
  ): Promise<PlayerResponse | null> => {
    const fromPage = await youtubeService.getPlayerResponseFromPage(videoId);
    if (fromPage?.videoDetails?.videoId === videoId) return fromPage;

    const response = await fetch(youtubeService.getVideoUrl(videoId), {
      credentials: 'include',
    });
    const html = await response.text();

    for (const pattern of YT_PLAYER_RESPONSE_PATTERNS) {
      const match = html.match(pattern);
      if (match?.index === undefined) continue;

      const jsonStart = html.indexOf('{', match.index);
      const jsonStr =
        jsonStart === -1 ? null : extractJsonObject(html, jsonStart);
      if (!jsonStr) continue;

      try {
        const parsed = JSON.parse(jsonStr) as PlayerResponse;
        if (parsed.videoDetails?.videoId === videoId) return parsed;
      } catch {
        // try next pattern
      }
    }

    return null;
  },

  /**
   * Request the player response from the MAIN world content script
   * (player-bridge.content.ts) via window.postMessage.
   */
  getPlayerResponseFromPage: (
    videoId: string
  ): Promise<PlayerResponse | null> => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve(null);
      }, PAGE_BRIDGE_TIMEOUT_MS);

      function handler(event: MessageEvent) {
        if (event.source !== window) return;
        const data = event.data as {
          type?: unknown;
          videoId?: unknown;
          data?: PlayerResponse | null;
        } | null;
        if (data?.type !== 'YT_SCRIPT_PLAYER_RESPONSE') return;
        if (data.videoId !== videoId) return;

        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        resolve(data.data ?? null);
      }

      window.addEventListener('message', handler);
      window.postMessage(
        { type: 'YT_SCRIPT_GET_PLAYER_RESPONSE', videoId },
        window.location.origin
      );
    });
  },

  /**
   * Captions the YouTube player downloaded for itself (with the token
   * YouTube requires), read via the MAIN world bridge. If the player has none
   * yet, the bridge turns captions on for a moment and back off.
   * Only works for the video currently on screen.
   */
  fetchFromPlayerCaptions: (videoId: string): Promise<CaptionResult | null> => {
    if (youtubeService.getVideoId() !== videoId) return Promise.resolve(null);

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve(null);
      }, PLAYER_CAPTIONS_TIMEOUT_MS);

      function handler(event: MessageEvent) {
        if (event.source !== window) return;
        const message = event.data as {
          type?: unknown;
          videoId?: unknown;
          data?: { body?: unknown; language?: unknown } | null;
        } | null;
        if (message?.type !== 'YT_SCRIPT_CAPTIONS') return;
        if (message.videoId !== videoId) return;

        clearTimeout(timeout);
        window.removeEventListener('message', handler);

        const body = message.data?.body;
        if (typeof body !== 'string' || body === '') {
          resolve(null);
          return;
        }
        try {
          const language = message.data?.language;
          resolve({
            segments: parseJson3(body),
            language: typeof language === 'string' ? language : '',
          });
        } catch {
          // Not the JSON format we asked for
          resolve(null);
        }
      }

      window.addEventListener('message', handler);
      window.postMessage(
        { type: 'YT_SCRIPT_GET_CAPTIONS', videoId, allowToggle: true },
        window.location.origin
      );
    });
  },

  /**
   * Last resort: open YouTube's transcript panel and read it from the page.
   * Only works for the video currently on screen, and not on Shorts: there
   * the hidden video page can still hold the previous video's transcript.
   */
  fetchFromTranscriptPanel: async (
    videoId: string
  ): Promise<CaptionResult | null> => {
    if (youtubeService.getVideoId() !== videoId || isShortsPage()) return null;

    await youtubeService.openTranscriptPanel();
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const segmentSelectors = [
      'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"] ytd-transcript-segment-renderer',
      'ytd-transcript-segment-list-renderer ytd-transcript-segment-renderer',
      'ytd-transcript-segment-renderer',
    ];
    const textSelectors = [
      '.segment-text',
      'yt-formatted-string.segment-text',
      'span.yt-core-attributed-string',
    ];
    const timeSelectors = ['.segment-timestamp', 'div.segment-timestamp'];

    const selector = segmentSelectors.find(
      (candidate) => document.querySelectorAll(candidate).length > 0
    );
    if (!selector) return null;

    const segments: TranscriptSegment[] = [];
    for (const element of document.querySelectorAll(selector)) {
      const textElement = textSelectors
        .map((sel) => element.querySelector(sel))
        .find((found) => found !== null);
      const timeElement = timeSelectors
        .map((sel) => element.querySelector(sel))
        .find((found) => found !== null);

      const text = normalizeCaptionText(textElement?.textContent ?? '');
      if (!text) continue;

      segments.push({
        text,
        start: parseTimestamp(timeElement?.textContent ?? ''),
        duration: 0,
      });
    }

    return { segments, language: '' };
  },

  /**
   * Try to open the transcript panel by clicking the transcript button
   */
  openTranscriptPanel: async (): Promise<void> => {
    const existingPanel = document.querySelector(
      'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"][visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"]'
    );
    if (existingPanel) return;

    const buttonSelectors = [
      'ytd-video-description-transcript-section-renderer button',
      'button[aria-label*="transcript" i]',
    ];

    let transcriptButton =
      buttonSelectors
        .map((selector) => document.querySelector<HTMLButtonElement>(selector))
        .find((button) => button !== null) ?? null;

    if (!transcriptButton) {
      transcriptButton =
        Array.from(document.querySelectorAll('button')).find(
          (button) =>
            button.textContent?.toLowerCase().includes('transcript') ||
            button
              .getAttribute('aria-label')
              ?.toLowerCase()
              .includes('transcript')
        ) ?? null;
    }

    if (transcriptButton) {
      transcriptButton.click();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  },

  /**
   * Check if current page is a YouTube video page
   */
};
