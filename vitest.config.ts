import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

// WXT's plugin sets up the @/ aliases and a fake `browser` for unit tests
export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    include: ['src/**/*.test.ts'],
    // Run globals.css through PostCSS so tests can check the sidebar styles
    css: { include: [/globals\.css/] },
  },
});
