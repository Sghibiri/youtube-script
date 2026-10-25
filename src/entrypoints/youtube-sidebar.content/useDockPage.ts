import { useEffect, useState } from 'react';

/** Sidebar width in CSS pixels; the page is pushed left by this much. */
export const SIDEBAR_WIDTH = 420;

// Below this the page would get too narrow, so the sidebar covers it instead
const MIN_WINDOW_FOR_DOCK = 900;
const STYLE_ID = 'yt-script-dock';

/**
 * Make room for the sidebar next to YouTube's page instead of on top of it,
 * so the video and its controls stay fully visible.
 */
const DOCK_CSS = `
ytd-app { margin-right: ${SIDEBAR_WIDTH}px !important; }
#masthead-container {
  left: 0 !important;
  right: ${SIDEBAR_WIDTH}px !important;
  width: auto !important;
}
`;

function relayout(): void {
  // YouTube sizes the player when the window resizes
  window.dispatchEvent(new Event('resize'));
}

function useWideWindow(): boolean {
  const query = `(min-width: ${MIN_WINDOW_FOR_DOCK}px)`;
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setWide(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return wide;
}

/** Returns true while the page is pushed aside for the sidebar. */
export function useDockPage(open: boolean): boolean {
  const docked = useWideWindow() && open;

  useEffect(() => {
    if (!docked) return;
    document.getElementById(STYLE_ID)?.remove();

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = DOCK_CSS;
    document.head.append(style);
    relayout();

    return () => {
      style.remove();
      relayout();
    };
  }, [docked]);

  return docked;
}
