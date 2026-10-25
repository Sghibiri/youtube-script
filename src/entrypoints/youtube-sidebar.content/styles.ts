import globalsCss from '@/styles/globals.css?inline';

/**
 * The sidebar's styles, bundled into the content script as a string.
 *
 * WXT's `cssInjectionMode: 'ui'` fetches the stylesheet from the extension
 * when the sidebar mounts, and Chrome blocks that request on some YouTube
 * pages ("Unsafe attempt to load URL chrome-extension://…"). Bundling the CSS
 * means there is no request to block.
 *
 * `:root` becomes `:host` so the theme variables apply inside the shadow
 * root, as WXT does for `cssInjectionMode: 'ui'`.
 */
export const sidebarCss = globalsCss.replaceAll(':root', ':host');
