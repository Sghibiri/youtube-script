import { useState, useEffect } from 'react';

/**
 * Custom hook for Chrome storage
 * Auto-imported by WXT
 */
export function useStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    // Load from storage
    chrome.storage.local.get([key], (result: Record<string, unknown>) => {
      if (result[key] !== undefined) {
        setValue(result[key] as T);
      }
    });
  }, [key]);

  const setStorageValue = (newValue: T) => {
    setValue(newValue);
    chrome.storage.local.set({ [key]: newValue });
  };

  return [value, setStorageValue] as const;
}
