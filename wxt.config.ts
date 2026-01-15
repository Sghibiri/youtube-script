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
    version: '1.0.0',
    author: 'Created by Gibb',
    permissions: ['activeTab', 'tabs', 'storage', 'clipboardWrite'],
    host_permissions: ['*://*.youtube.com/*'],
    action: {
      default_title: 'YouTube Script',
    },
  },
});
