import ReactDOM from 'react-dom/client';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { I18nProvider } from '@/i18n';
import { youtubeService } from '@/services/youtubeService';
import App, { type VideoIdStore } from './App';
import { sidebarCss } from './styles';

/**
 * YouTube switches videos without reloading the page, so track the video ID
 * of the current URL and notify the app when it changes.
 */
function createVideoIdStore(ctx: ContentScriptContext): VideoIdStore {
  let current = youtubeService.getVideoId();
  const listeners = new Set<() => void>();

  ctx.addEventListener(window, 'wxt:locationchange', () => {
    const next = youtubeService.getVideoId();
    if (next === current) return;
    current = next;
    listeners.forEach((listener) => listener());
  });

  return {
    getSnapshot: () => current,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/**
 * YouTube marks its dark theme with <html dark>. The sidebar lives in its own
 * shadow root, so copy that flag inside for the dark: styles to apply.
 */
function mirrorDarkTheme(target: Element): MutationObserver {
  const sync = () =>
    target.toggleAttribute(
      'dark',
      document.documentElement.hasAttribute('dark')
    );
  sync();

  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['dark'],
  });
  return observer;
}

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  // CSS is bundled and passed to the shadow root below (see styles.ts)
  cssInjectionMode: 'manual',
  runAt: 'document_end',

  async main(ctx) {
    // Mount on every page: the app only shows itself on video pages
    const videoIdStore = createVideoIdStore(ctx);

    const ui = await createShadowRootUi(ctx, {
      name: 'youtube-script-sidebar',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      css: sidebarCss,
      // Keep typing in the sidebar from triggering YouTube shortcuts (f, k, j…)
      isolateEvents: true,
      onMount: (container, shadow) => {
        const themeObserver = mirrorDarkTheme(
          shadow.querySelector('html') ?? container
        );
        const root = ReactDOM.createRoot(container);
        root.render(
          <I18nProvider>
            <App videoIdStore={videoIdStore} />
          </I18nProvider>
        );
        return { root, themeObserver };
      },
      onRemove: (mounted) => {
        mounted?.themeObserver.disconnect();
        mounted?.root.unmount();
      },
    });

    ui.mount();
  },
});
