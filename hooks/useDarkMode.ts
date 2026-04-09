'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'library-theme';

/**
 * Reads the initial theme from localStorage or system preference.
 * Used as the server-side snapshot (defaults to dark).
 */
function getServerSnapshot(): boolean {
  return true; // default dark on SSR
}

/**
 * Reads the current dark mode state from the DOM class list.
 */
function getSnapshot(): boolean {
  return document.documentElement.classList.contains('dark');
}

/**
 * Subscribes to storage events so cross-tab theme changes sync.
 */
function subscribe(callback: () => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      applyTheme();
      callback();
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

/**
 * Reads localStorage / system pref and applies to <html>.
 */
function applyTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  let dark: boolean;
  if (stored !== null) {
    dark = stored === 'dark';
  } else {
    dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  const root = document.documentElement;
  if (dark) {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }

  // Update mobile browser chrome color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', dark ? '#120C07' : '#FEFCF9');
  }
}

/**
 * Manages light/dark mode toggle with localStorage persistence
 * and system preference detection. Uses useSyncExternalStore to
 * avoid the "setState inside useEffect" anti-pattern.
 */
export function useDarkMode() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains('dark');
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    applyTheme();
    // Force re-render by dispatching a synthetic storage event
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  }, []);

  return { isDark, toggle };
}
