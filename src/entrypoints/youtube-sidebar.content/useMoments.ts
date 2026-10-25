import { useEffect } from 'react';
import type { Moment } from '@/utils/answer';
import { youtubeService } from '@/services/youtubeService';
import {
  clearMoments,
  drawMoments,
  hasMoments,
} from '@/services/progressBarMarkers';

// YouTube rebuilds the player on some changes (ads, theater mode, resizing)
const REDRAW_CHECK_MS = 2000;

/** Keep the moments on YouTube's progress bar while they apply. */
export function useMoments(moments: readonly Moment[]): void {
  useEffect(() => {
    if (moments.length === 0) {
      clearMoments();
      return;
    }

    const draw = () => {
      // During an ad the bar shows the ad's length, not the video's
      const player = youtubeService.getPlayer();
      if (player?.classList.contains('ad-showing')) {
        clearMoments();
        return;
      }
      const video = youtubeService.getVideoElement();
      drawMoments(moments, video?.duration ?? Number.NaN);
    };

    draw();
    const timer = setInterval(() => {
      const player = youtubeService.getPlayer();
      const adShowing = player?.classList.contains('ad-showing') ?? false;
      if (adShowing === hasMoments()) draw();
    }, REDRAW_CHECK_MS);

    return () => {
      clearInterval(timer);
      clearMoments();
    };
  }, [moments]);
}
