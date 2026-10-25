/**
 * The two kinds of YouTube video page: regular videos (/watch?v=…) and
 * Shorts (/shorts/…).
 *
 * Each has its own player: #movie_player for videos, #shorts-player for
 * Shorts. After moving between the two without a reload, the other player
 * stays in the page, hidden and still holding its last video, so the player
 * is always picked by the kind of page that is open.
 */

const VIDEO_ID_PATTERN = /^[\w-]{11}$/;
const SHORTS_PATH = /^\/shorts\/([^/]+)\/?$/;

export function isVideoId(value: unknown): value is string {
  return typeof value === 'string' && VIDEO_ID_PATTERN.test(value);
}

export function isShortsPage(
  pathname: string = window.location.pathname
): boolean {
  return SHORTS_PATH.test(pathname);
}

/** Video ID of a /watch?v=… or /shorts/… page, or null on other pages. */
export function videoIdFromLocation({
  pathname,
  search,
}: Pick<Location, 'pathname' | 'search'>): string | null {
  const videoId =
    pathname === '/watch'
      ? new URLSearchParams(search).get('v')
      : SHORTS_PATH.exec(pathname)?.[1];
  return isVideoId(videoId) ? videoId : null;
}

/** The player showing the video of the page that is open. */
export function getActivePlayer(): HTMLElement | null {
  return document.getElementById(
    isShortsPage() ? 'shorts-player' : 'movie_player'
  );
}

/** On Shorts: the reel that is playing (video, title, progress bar). */
export function getActiveReel(): Element | null {
  if (!isShortsPage()) return null;
  return getActivePlayer()?.closest('ytd-reel-video-renderer') ?? null;
}
