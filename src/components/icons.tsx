/** Small line icons shared by the sidebar and the popup (decorative). */

export function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 5L15 15M5 15L15 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EditIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10.5 2.75l2.75 2.75L6 12.75H3.25V10L10.5 2.75z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BookIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3.25C3 2.56 3.56 2 4.25 2H13v10.25H4.25C3.56 12.25 3 12.81 3 13.5V3.25z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M3 13.5c0 .69.56 1 1.25 1H13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Shared props of the 16px line icons below */
const LINE = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  'aria-hidden': true,
} as const;

const STROKE = {
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function BookmarkIcon() {
  return (
    <svg {...LINE}>
      <path d="M4.5 2.75h7v10.5L8 10.5l-3.5 2.75V2.75z" {...STROKE} />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg {...LINE}>
      <path d="M3.5 8.5l3 3 6-6.5" {...STROKE} />
    </svg>
  );
}

export function CopyIcon() {
  return (
    <svg {...LINE}>
      <rect x="5.25" y="5.25" width="8" height="8" rx="1.5" {...STROKE} />
      <path
        d="M10.75 5.25v-1.5c0-.83-.67-1.5-1.5-1.5h-5.5c-.83 0-1.5.67-1.5 1.5v5.5c0 .83.67 1.5 1.5 1.5h1.5"
        {...STROKE}
      />
    </svg>
  );
}

export function ExternalIcon() {
  return (
    <svg {...LINE}>
      <path
        d="M9.5 2.75h3.75V6.5M13.25 2.75L7.5 8.5M11.75 9.5v3c0 .41-.34.75-.75.75H3.5a.75.75 0 01-.75-.75V5c0-.41.34-.75.75-.75h3"
        {...STROKE}
      />
    </svg>
  );
}

export type StatusKind = 'success' | 'error' | 'info';

const STATUS_COLOR: Readonly<Record<StatusKind, string>> = Object.freeze({
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-[var(--color-text-secondary)]',
});

export function StatusIcon({ kind }: { kind: StatusKind }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={`mt-px shrink-0 ${STATUS_COLOR[kind]}`}
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      {kind === 'success' && (
        <path
          d="M5.25 8.25l1.75 1.75 3.75-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {kind === 'error' && (
        <path
          d="M8 4.75v3.75M8 10.75v.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
      {kind === 'info' && (
        <path
          d="M8 7.25v3.75M8 4.75v.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
