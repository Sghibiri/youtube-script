import type { TranslationStrings } from '@/i18n';
import type { StatusKind } from '@/components/icons';
import type { SendResult } from '@/services/llmService';

export interface SendNotice {
  kind: StatusKind;
  text: string;
}

/** What to tell the user when the answer will not come back here. */
export function describeSendResult(
  result: Exclude<SendResult, { watching: true }>,
  t: TranslationStrings,
  formatString: (template: string, vars: Record<string, string>) => string,
  providerLabel: string
): SendNotice {
  if (result.ok) {
    const template = result.autoSend ? t.sentAuto : t.pasteHint;
    return {
      kind: 'success',
      text: formatString(template, { provider: providerLabel }),
    };
  }
  const errors = {
    copy: t.errorCopy,
    open: t.errorOpenAi,
    reload: t.errorReload,
  };
  return { kind: 'error', text: errors[result.reason] };
}
