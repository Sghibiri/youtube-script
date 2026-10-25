import type { Moment } from '@/utils/answer';
import { getActiveReel, isShortsPage } from '@/utils/youtubePage';

/**
 * Key moments drawn on YouTube's progress bar, as small dots with a tooltip.
 *
 * The dots sit inside the player's own progress bar so they follow its size
 * (theater mode, fullscreen, resizing). They are plain page elements: our
 * styles stay inline, every class is prefixed, and `pointer-events: none`
 * keeps seeking and hover previews working exactly as before.
 */

const LAYER_ID = 'yt-script-moments';
const BAR_SELECTORS = ['#movie_player .ytp-progress-bar', '.ytp-progress-bar'];
// Shorts draw their own bar below the video, outside the player
const SHORTS_BAR_SELECTOR = 'yt-progress-bar';
const MARKER_COLOR = '#facc15';

function findBar(): HTMLElement | null {
  if (isShortsPage()) {
    return (
      getActiveReel()?.querySelector<HTMLElement>(SHORTS_BAR_SELECTOR) ?? null
    );
  }
  for (const selector of BAR_SELECTORS) {
    const bar = document.querySelector<HTMLElement>(selector);
    if (bar) return bar;
  }
  return null;
}

function createLayer(): HTMLElement {
  const layer = document.createElement('div');
  layer.id = LAYER_ID;
  layer.setAttribute('aria-hidden', 'true');
  Object.assign(layer.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '40',
  });
  return layer;
}

function createMarker(moment: Moment, duration: number): HTMLElement {
  const marker = document.createElement('div');
  const percent = Math.min(100, Math.max(0, (moment.seconds / duration) * 100));
  marker.title = moment.label;
  Object.assign(marker.style, {
    position: 'absolute',
    left: `${percent}%`,
    top: '50%',
    width: '6px',
    height: '6px',
    marginLeft: '-3px',
    marginTop: '-3px',
    borderRadius: '50%',
    background: MARKER_COLOR,
    boxShadow: '0 0 0 1.5px rgba(0, 0, 0, 0.6)',
  });
  return marker;
}

export function clearMoments(): void {
  document.getElementById(LAYER_ID)?.remove();
}

/**
 * Draw the moments. Returns false when the bar or the video length is not
 * available yet (the caller can try again later).
 */
export function drawMoments(
  moments: readonly Moment[],
  duration: number
): boolean {
  clearMoments();
  if (moments.length === 0) return true;

  const bar = findBar();
  if (!bar || !Number.isFinite(duration) || duration <= 0) return false;

  const layer = createLayer();
  for (const moment of moments) {
    if (moment.seconds <= duration) {
      layer.appendChild(createMarker(moment, duration));
    }
  }
  bar.appendChild(layer);
  return true;
}

/** True while our layer is still in the page (YouTube can rebuild the bar). */
export function hasMoments(): boolean {
  return document.getElementById(LAYER_ID) !== null;
}
