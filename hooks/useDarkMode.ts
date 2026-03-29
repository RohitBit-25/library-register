'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'library-theme';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setTimeout(() => setIsDark(stored === 'dark'), 0);
    } else {
      setTimeout(() => setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches), 0);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const toggle = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return { isDark, toggle };
}
