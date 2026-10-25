import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n';
import { youtubeService } from '@/services/youtubeService';
import { NOW_PLAYING_ROW } from './AnswerPanel';
import {
  findParagraphAt,
  formatTimestamp,
  splitByQuery,
  type TranscriptParagraph,
} from '@/utils/transcript';

/**
 * Index of the item (sorted by start time) the player is currently in, or -1.
 * Used for transcript paragraphs and for the moments in an answer.
 */
export function usePlaybackIndex(
  items: readonly { start: number }[],
  enabled: boolean
): number {
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const video = youtubeService.getVideoElement();
    if (!enabled || !video || items.length === 0) {
      setActive(-1);
      return;
    }

    // During an ad the video element plays the ad, not this video
    const player = youtubeService.getPlayer();
    // React skips the re-render when the index is unchanged
    const update = () =>
      setActive(
        player?.classList.contains('ad-showing')
          ? -1
          : findParagraphAt(items, video.currentTime)
      );
    update();
    video.addEventListener('timeupdate', update);
    video.addEventListener('seeked', update);
    return () => {
      video.removeEventListener('timeupdate', update);
      video.removeEventListener('seeked', update);
    };
  }, [items, enabled]);

  return active;
}

function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {splitByQuery(text, query).map((part, index) =>
        part.match ? (
          <mark
            key={index}
            className="rounded-sm bg-yellow-200 text-inherit dark:bg-yellow-500/40"
          >
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  );
}

interface TranscriptViewProps {
  visible: readonly { paragraph: TranscriptParagraph; index: number }[];
  query: string;
  active: number;
  /** Bumped to scroll the playing paragraph into view */
  scrollRequest: number;
}

export function TranscriptView({
  visible,
  query,
  active,
  scrollRequest,
}: TranscriptViewProps) {
  const { t, formatString } = useI18n();
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (scrollRequest === 0 || active < 0) return;
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    // Only when asked (not on every playback tick), so `active` is left out
  }, [scrollRequest]);

  return (
    <ol ref={listRef} className="m-0 list-none px-2 py-2">
      {visible.map(({ paragraph, index }) => {
        const time = formatTimestamp(paragraph.start);
        const label = formatString(t.jumpTo, { time });
        return (
          <li
            key={index}
            data-index={index}
            className={`grid grid-cols-[3.25rem_1fr] gap-x-2 rounded-md px-2 py-1.5 ${
              index === active ? NOW_PLAYING_ROW : ''
            }`}
          >
            <span className="pt-px">
              <button
                className="inline-flex cursor-pointer items-center rounded border-none bg-transparent px-1 text-[12px] font-semibold tabular-nums leading-5 text-[var(--color-link)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                onClick={() => youtubeService.seekTo(paragraph.start)}
                aria-label={label}
                title={label}
              >
                {time}
              </button>
            </span>
            <p className="m-0 text-[13px] leading-relaxed">
              <Highlighted text={paragraph.text} query={query} />
            </p>
          </li>
        );
      })}
    </ol>
  );
}
