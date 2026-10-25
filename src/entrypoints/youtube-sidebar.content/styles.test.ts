import { describe, expect, it } from 'vitest';
import { sidebarCss } from './styles';

describe('sidebarCss', () => {
  it('bundles the compiled Tailwind styles', () => {
    expect(sidebarCss).toContain('--tw-');
    expect(sidebarCss).not.toContain('@tailwind');
  });

  it('puts the theme variables on the shadow host', () => {
    expect(sidebarCss).toMatch(/:host\s*\{[^}]*--color-primary:/);
    expect(sidebarCss).not.toContain(':root');
  });
});
