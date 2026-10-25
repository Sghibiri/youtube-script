import { useI18n } from '@/i18n';
import { llmService } from '@/services/llmService';
import { secondaryButton } from '@/components/controls';
import appIcon from '@/assets/icons/app-icon.svg';

/**
 * Shown when the toolbar icon is clicked outside a YouTube video.
 * On a video page the icon opens the sidebar instead (see background).
 */
function App() {
  const { t } = useI18n();

  const openLibrary = async () => {
    if (await llmService.openLibrary()) window.close();
  };

  return (
    <div className="flex w-[300px] items-center gap-3 bg-[var(--color-bg-primary)] p-4 font-sans text-[var(--color-text-primary)]">
      <img src={appIcon} alt="" className="h-8 w-8 shrink-0" />
      <div className="min-w-0">
        <h1 className="m-0 text-[14px] font-semibold leading-tight">
          {t.appTitle}
        </h1>
        <p className="m-0 mt-0.5 text-[13px] leading-snug text-[var(--color-text-secondary)]">
          {t.openVideoHint}
        </p>
        <button
          className={`${secondaryButton} mt-2.5 h-7 px-2.5 text-xs`}
          onClick={() => void openLibrary()}
        >
          {t.openLibrary}
        </button>
      </div>
    </div>
  );
}

export default App;
