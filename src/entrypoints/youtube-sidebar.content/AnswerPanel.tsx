import { Fragment, type ReactNode } from 'react';
import { useI18n } from '@/i18n';
import type { AnswerInline, AnswerNode } from '@/types';
import {
  leadInlines,
  splitLeadingTimestamp,
  splitSummary,
  splitTimestamps,
} from '@/utils/answer';
import { PROVIDER_INFO } from '@/utils/providers';
import { formatTimestamp } from '@/utils/transcript';
import type { AnswerState } from './useAnswer';

interface AnswerBodyProps {
  nodes: readonly AnswerNode[];
  /** Video length, so times past the end are not made clickable */
  maxSeconds: number;
  /** Start of the moment that is playing now, to highlight its line */
  playingSeconds?: number | null;
  /** Times jump the player here (sidebar)… */
  onSeek?: (seconds: number) => void;
  /** …or link to the video at that time (Library) */
  timeHref?: (seconds: number) => string;
  /** Turns parts of the text into elements first, e.g. note citations */
  splitText?: (text: string) => (string | ReactNode)[];
}

interface AnswerViewProps extends Omit<AnswerBodyProps, 'nodes'> {
  answer: Exclude<AnswerState, { status: 'none' }>;
  momentCount: number;
}

interface RenderContext {
  maxSeconds: number;
  playingSeconds: number | null;
  onSeek?: (seconds: number) => void;
  timeHref?: (seconds: number) => string;
  splitText?: (text: string) => (string | ReactNode)[];
  jumpLabel: (seconds: number) => string;
}

/** Neutral row with an accent edge: the part of the video playing now. */
export const NOW_PLAYING_ROW =
  'bg-[var(--color-bg-tertiary)] shadow-[inset_2px_0_0_var(--color-primary)]';

const timeChip =
  'inline-flex cursor-pointer items-center rounded border-none bg-transparent px-1 text-[12px] font-semibold tabular-nums leading-5 text-[var(--color-link)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';

function TimeButton({
  label,
  seconds,
  ctx,
}: {
  label: string;
  seconds: number;
  ctx: RenderContext;
}) {
  const name = ctx.jumpLabel(seconds);
  const href = ctx.timeHref?.(seconds);
  if (href) {
    return (
      <a
        className={timeChip}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={name}
        title={name}
      >
        {label}
      </a>
    );
  }
  return (
    <button
      className={timeChip}
      onClick={() => ctx.onSeek?.(seconds)}
      aria-label={name}
      title={name}
    >
      {label}
    </button>
  );
}

/** Text with formatting, where every m:ss becomes a jump button. */
function Inlines({
  inlines,
  ctx,
}: {
  inlines: readonly AnswerInline[];
  ctx: RenderContext;
}) {
  return (
    <>
      {inlines.map((inline, index) => {
        const pieces = ctx.splitText?.(inline.text) ?? [inline.text];
        const parts = pieces.flatMap((piece, pieceIndex) =>
          typeof piece === 'string'
            ? splitTimestamps(piece, ctx.maxSeconds).map((part, partIndex) =>
                part.kind === 'time' ? (
                  <TimeButton
                    key={`${pieceIndex}-${partIndex}`}
                    label={part.text}
                    seconds={part.seconds}
                    ctx={ctx}
                  />
                ) : (
                  part.text
                )
              )
            : [<Fragment key={`${pieceIndex}`}>{piece}</Fragment>]
        );
        let node: ReactNode = parts;
        if (inline.code) {
          node = (
            <code className="rounded bg-[var(--color-bg-tertiary)] px-1 font-mono text-[12px]">
              {parts}
            </code>
          );
        }
        if (inline.italic) node = <em>{node}</em>;
        if (inline.bold)
          node = <strong className="font-semibold">{node}</strong>;
        return <span key={index}>{node}</span>;
      })}
    </>
  );
}

function ListItem({
  nodes,
  ordered,
  number,
  ctx,
}: {
  nodes: readonly AnswerNode[];
  ordered: boolean;
  number: number;
  ctx: RenderContext;
}) {
  const lead = splitLeadingTimestamp(leadInlines(nodes), ctx.maxSeconds);
  const rest = lead ? nodes.slice(1) : nodes;

  // Time-stamped lines read like the transcript: time on the left, and the
  // line for the part that is playing is highlighted
  if (lead) {
    const playing = lead.seconds === ctx.playingSeconds;
    return (
      <li
        className={`-mx-2 grid grid-cols-[3.25rem_1fr] gap-x-2 rounded-md px-2 py-1 ${
          playing ? NOW_PLAYING_ROW : ''
        }`}
        aria-current={playing ? 'time' : undefined}
      >
        <span className="pt-px">
          <TimeButton label={lead.label} seconds={lead.seconds} ctx={ctx} />
        </span>
        <div className="min-w-0">
          <p className="m-0">
            {ordered && (
              <span className="mr-1 font-semibold tabular-nums text-[var(--color-text-secondary)]">
                {number}.
              </span>
            )}
            <Inlines inlines={lead.rest} ctx={ctx} />
          </p>
          <Nodes nodes={rest} ctx={ctx} />
        </div>
      </li>
    );
  }

  return (
    <li className="flex gap-2 py-0.5">
      <span
        aria-hidden="true"
        className={`shrink-0 text-right tabular-nums text-[var(--color-text-secondary)] ${
          ordered ? 'w-5 font-semibold' : 'w-3'
        }`}
      >
        {ordered ? `${number}.` : '•'}
      </span>
      <div className="min-w-0 flex-1">
        <Nodes nodes={nodes} ctx={ctx} />
      </div>
    </li>
  );
}

function Nodes({
  nodes,
  ctx,
}: {
  nodes: readonly AnswerNode[];
  ctx: RenderContext;
}) {
  return (
    <>
      {nodes.map((node, index) => {
        switch (node.kind) {
          case 'heading':
            return (
              <h4
                key={index}
                className={`m-0 mt-4 font-semibold first:mt-0 ${
                  node.level === 1 ? 'text-[15px]' : 'text-[13px]'
                } ${node.level === 3 ? 'text-[var(--color-text-secondary)]' : ''}`}
              >
                <Inlines inlines={node.inlines} ctx={ctx} />
              </h4>
            );
          case 'paragraph':
            return (
              <p key={index} className="m-0 mt-1.5 first:mt-0">
                <Inlines inlines={node.inlines} ctx={ctx} />
              </p>
            );
          case 'list': {
            const start = node.start ?? 1;
            // Ordered lists keep their numbers; screen readers get them from the text
            return (
              <ul key={index} className="m-0 mt-1 list-none p-0">
                {node.items.map((item, itemIndex) => (
                  <ListItem
                    key={itemIndex}
                    nodes={item}
                    ordered={node.ordered}
                    number={start + itemIndex}
                    ctx={ctx}
                  />
                ))}
              </ul>
            );
          }
          case 'quote':
            return (
              <blockquote
                key={index}
                className="m-0 mt-2 border-0 border-l-2 border-solid border-[var(--color-border-primary)] pl-3 text-[var(--color-text-secondary)]"
              >
                <Nodes nodes={node.children} ctx={ctx} />
              </blockquote>
            );
          case 'code':
            return (
              <pre
                key={index}
                className="m-0 mt-2 overflow-x-auto rounded-md bg-[var(--color-bg-tertiary)] p-2 font-mono text-[12px] leading-snug"
              >
                {node.text}
              </pre>
            );
          case 'rule':
            return (
              <hr
                key={index}
                className="my-3 border-0 border-t border-solid border-[var(--color-border-primary)]"
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}

/** Placeholder in the shape of the answer while the AI is working. */
function AnswerSkeleton() {
  const bar =
    'h-2.5 rounded bg-[var(--color-border-primary)] animate-pulse motion-reduce:animate-none';
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-lg bg-[var(--color-bg-secondary)] px-3 py-3">
        <div className={`${bar} w-full`} />
        <div className={`${bar} w-11/12`} />
        <div className={`${bar} w-3/5`} />
      </div>
      {[0.8, 0.65, 0.75].map((width, index) => (
        <div key={index} className="grid grid-cols-[3.25rem_1fr] gap-x-2">
          <div className={`${bar} w-9`} />
          <div className={bar} style={{ width: `${width * 100}%` }} />
        </div>
      ))}
    </div>
  );
}

function AlertIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="mt-px shrink-0 text-red-600 dark:text-red-400"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 4.75v3.75M8 10.75v.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The answer itself: the summary box, then the rest. */
export function AnswerBody({
  nodes,
  maxSeconds,
  playingSeconds = null,
  onSeek,
  timeHref,
  splitText,
}: AnswerBodyProps) {
  const { t, formatString } = useI18n();
  const ctx: RenderContext = {
    maxSeconds,
    playingSeconds,
    onSeek,
    timeHref,
    splitText,
    jumpLabel: (seconds) =>
      formatString(timeHref ? t.openAt : t.jumpTo, {
        time: formatTimestamp(seconds),
      }),
  };
  const { summary, rest } = splitSummary(nodes);

  return (
    <>
      {summary.length > 0 && (
        <div className="rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2.5 text-[14px] leading-relaxed">
          <Nodes nodes={summary} ctx={ctx} />
        </div>
      )}

      {rest.length > 0 && (
        <div>
          <Nodes nodes={rest} ctx={ctx} />
        </div>
      )}
    </>
  );
}

export function AnswerView({
  answer,
  momentCount,
  ...bodyProps
}: AnswerViewProps) {
  const { t, formatString } = useI18n();
  const provider = PROVIDER_INFO[answer.provider].label;

  const failureText = {
    composer: t.answerFailedComposer,
    send: t.answerFailedSend,
    'no-reply': t.answerFailedNoReply,
  }[answer.failure ?? 'no-reply'];

  const statusText = {
    waiting: formatString(t.answerWaiting, { provider }),
    writing: formatString(t.answerWriting, { provider }),
    done:
      momentCount > 0
        ? formatString(t.answerMoments, { count: String(momentCount) })
        : '',
    failed: formatString(failureText, { provider }),
  }[answer.status];

  const busy = answer.status === 'waiting' || answer.status === 'writing';

  return (
    <div className="flex flex-col gap-3 px-4 py-3 text-[13px] leading-relaxed">
      {statusText && (
        <p
          role="status"
          aria-live="polite"
          className={`m-0 flex gap-2 text-xs ${
            answer.status === 'failed'
              ? 'items-start rounded-md border border-solid border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-3 py-2 text-[var(--color-text-primary)]'
              : 'items-center text-[var(--color-text-secondary)]'
          }`}
        >
          {busy && (
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary motion-reduce:animate-none"
            />
          )}
          {answer.status === 'failed' && <AlertIcon />}
          {statusText}
        </p>
      )}

      {busy && answer.nodes.length === 0 && <AnswerSkeleton />}

      <AnswerBody nodes={answer.nodes} {...bodyProps} />
    </div>
  );
}
