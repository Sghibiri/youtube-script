import type { UserPreferences } from '@/types';

/**
 * Merge changes into the saved preferences without dropping other fields
 * (language, custom prompts, ...).
 */
export async function updatePreferences(
  changes: Partial<UserPreferences>
): Promise<void> {
  const stored = await browser.storage.local.get('preferences');
  const current = (stored.preferences ?? {}) as Partial<UserPreferences>;
  await browser.storage.local.set({ preferences: { ...current, ...changes } });
}
