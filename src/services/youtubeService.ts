import type { TranscriptData, TranscriptSegment } from '@/types';

/**
 * Service for extracting YouTube video transcripts
 */
export const youtubeService = {
  /**
   * Extract video ID from YouTube URL
   */
  getVideoId: (): string | null => {
    const url = window.location.href;
    const match = url.match(/[?&]v=([^&]+)/);
    return match?.[1] ?? null;
  },

  /**
   * Get video title from page
   */
  getVideoTitle: (): string => {
    const titleElement = document.querySelector(
      'h1.ytd-watch-metadata yt-formatted-string'
    );
    return titleElement?.textContent?.trim() || 'Unknown Video';
  },

  /**
   * Get full video URL
   */
  getVideoUrl: (): string => {
    const videoId = youtubeService.getVideoId();
    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';
  },

  /**
   * Fetch transcript from YouTube's API
   */
  fetchTranscript: async (): Promise<TranscriptData> => {
    const videoId = youtubeService.getVideoId();
    if (!videoId) {
      throw new Error('No video ID found in URL');
    }

    const title = youtubeService.getVideoTitle();

    try {
      // Try to get transcript from the page's transcript panel
      const transcript = await youtubeService.extractTranscriptFromPanel();

      if (transcript) {
        return {
          videoId,
          title,
          videoUrl: youtubeService.getVideoUrl(),
          transcript: transcript.text,
          segments: transcript.segments,
        };
      }

      throw new Error('Transcript not available for this video');
    } catch (error) {
      throw new Error(
        `Failed to fetch transcript: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Extract transcript by opening the transcript panel
   */
  extractTranscriptFromPanel: async (): Promise<{
    text: string;
    segments: TranscriptSegment[];
  } | null> => {
    // Click the "Show transcript" button
    const transcriptButton = document.querySelector(
      'button[aria-label*="transcript" i], button[aria-label*="Show transcript" i]'
    ) as HTMLButtonElement;

    if (!transcriptButton) {
      // Try alternative selector
      const buttons = Array.from(document.querySelectorAll('button'));
      const showTranscriptBtn = buttons.find(
        (btn) =>
          btn.textContent?.toLowerCase().includes('transcript') ||
          btn.getAttribute('aria-label')?.toLowerCase().includes('transcript')
      );

      if (!showTranscriptBtn) {
        throw new Error(
          'Transcript button not found. Make sure the video has captions available.'
        );
      }

      (showTranscriptBtn as HTMLButtonElement).click();
    } else {
      transcriptButton.click();
    }

    // Wait for transcript panel to load
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Extract transcript segments
    const segmentElements = document.querySelectorAll(
      'ytd-transcript-segment-renderer'
    );

    if (segmentElements.length === 0) {
      return null;
    }

    const segments: TranscriptSegment[] = [];
    const textChunks: string[] = [];
    let currentChunk: string[] = [];
    let lastTime = 0;

    segmentElements.forEach((segment) => {
      const textElement = segment.querySelector(
        'yt-formatted-string.segment-text'
      );
      const timeElement = segment.querySelector(
        'div.segment-timestamp'
      ) as HTMLElement;

      if (textElement && timeElement) {
        const text = textElement.textContent?.trim() || '';
        const timeText = timeElement.textContent?.trim() || '0:00';

        // Convert time to seconds
        const timeParts = timeText.split(':').map(Number);
        const start =
          timeParts.length === 2
            ? timeParts[0]! * 60 + timeParts[1]!
            : timeParts[0]! * 3600 + timeParts[1]! * 60 + timeParts[2]!;

        segments.push({
          text,
          start,
          duration: 0,
        });

        currentChunk.push(text);

        // Create paragraph break every ~30 seconds OR every 15 segments
        const timeDiff = start - lastTime;
        const shouldBreak = timeDiff > 30 || currentChunk.length >= 15;

        if (shouldBreak && currentChunk.length > 0) {
          textChunks.push(currentChunk.join(' '));
          currentChunk = [];
          lastTime = start;
        }
      }
    });

    // Add remaining chunk
    if (currentChunk.length > 0) {
      textChunks.push(currentChunk.join(' '));
    }

    // Join paragraphs with double line breaks
    const fullText = textChunks.join('\n\n');

    return {
      text: fullText,
      segments,
    };
  },

  /**
   * Check if current page is a YouTube video page
   */
  isYouTubeVideoPage: (): boolean => {
    return (
      window.location.hostname.includes('youtube.com') &&
      window.location.pathname === '/watch'
    );
  },
};
