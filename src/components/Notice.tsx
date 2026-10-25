import type { ReactNode } from 'react';
import { StatusIcon, type StatusKind } from '@/components/icons';

/** A short message with an icon: sent, failed, or what to do next. */
export function NoticeBox({
  kind,
  children,
}: {
  kind: StatusKind;
  children: ReactNode;
}) {
  return (
    <p
      role="status"
      className="m-0 flex items-start gap-2 rounded-md border border-solid border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs leading-relaxed text-[var(--color-text-primary)]"
    >
      <StatusIcon kind={kind} />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
