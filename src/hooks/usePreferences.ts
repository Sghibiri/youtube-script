import { useEffect, useState } from 'react';
import type { UserPreferences } from '@/types';

type StoredPreferences = Partial<UserPreferences>;

/**
 * Saved preferences, kept in sync when the popup or another tab changes them.
 * Null until the first read from storage finishes.
 */
export function usePreferences(): StoredPreferences | null {
  const [preferences, setPreferences] = useState<StoredPreferences | null>(
    null
  );

  useEffect(() => {
    let active = true;

    browser.storage.local.get('preferences').then((stored) => {
      if (active) {
        setPreferences((stored.preferences ?? {}) as StoredPreferences);
      }
    });

    const onChanged = (
      changes: Record<string, { newValue?: unknown }>,
      area: string
    ) => {
      if (area === 'local' && changes.preferences) {
        setPreferences(
          (changes.preferences.newValue ?? {}) as StoredPreferences
        );
      }
    };

    browser.storage.onChanged.addListener(onChanged);
    return () => {
      active = false;
      browser.storage.onChanged.removeListener(onChanged);
    };
  }, []);

  return preferences;
}
