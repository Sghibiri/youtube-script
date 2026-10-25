/**
 * Extension pages follow the system theme through the same [dark] attribute
 * YouTube uses, so the shared dark styles apply.
 */
export function followSystemTheme(): void {
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const applyTheme = () =>
    document.documentElement.toggleAttribute('dark', darkQuery.matches);
  applyTheme();
  darkQuery.addEventListener('change', applyTheme);
}
