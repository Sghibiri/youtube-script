import ReactDOM from 'react-dom/client';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { I18nProvider } from '@/i18n';
import App from './App';
import './style.css';

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    // Only run on video pages
    if (!window.location.pathname.includes('/watch')) {
      return;
    }

    const ui = await createShadowRootUi(ctx, {
      name: 'youtube-script-sidebar',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(
          <I18nProvider>
            <App />
          </I18nProvider>
        );
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
