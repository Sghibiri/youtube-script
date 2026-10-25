import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  alias: {
    '@': 'src',
    '@components': 'src/components',
    '@hooks': 'src/hooks',
    '@utils': 'src/utils',
    '@types': 'src/types',
    '@services': 'src/services',
  },
  manifest: {
    name: 'YouTube Script',
    description:
      'Extract YouTube video transcripts and send them to AI assistants (ChatGPT, Claude, Gemini, Grok, DeepSeek)',
    version: '1.2.0',
    author: 'Created by Gibb',
    // unlimitedStorage: saved notes can grow past the 10 MB default
    permissions: [
      'activeTab',
      'tabs',
      'storage',
      'unlimitedStorage',
      'clipboardWrite',
    ],
    host_permissions: ['*://*.youtube.com/*'],
    // On YouTube videos the icon opens the sidebar; the popup is only the
    // "open a video" note shown elsewhere (set per tab by the background)
    action: {
      default_title: 'YouTube Script',
      default_popup: 'popup.html',
    },
  },
});
