/** Control styles shared by the sidebar and the toolbar popup. */

export const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary';

export const ghostButton = `inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-md border-none bg-transparent px-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

export const primaryButton = `inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-[var(--color-action)] px-3 text-[13px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

export const secondaryButton = `inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-solid border-[var(--color-border-primary)] bg-transparent px-3 text-[13px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

// Native selects keep keyboard and screen reader support; the arrow is ours
export const selectBox = `h-8 min-w-0 cursor-pointer appearance-none rounded-md border border-solid border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] bg-no-repeat pe-7 ps-2.5 text-[13px] text-[var(--color-text-primary)] hover:border-[var(--color-text-tertiary)] ${focusRing}`;

export const SELECT_ARROW = Object.freeze({
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237c8696' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
  backgroundPosition: 'right 10px center',
});
