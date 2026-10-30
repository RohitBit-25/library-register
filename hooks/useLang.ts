'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { translate, type Lang } from '@/lib/i18n';

const KEY = 'gangaur-lang';
const EVENT = 'gangaur-lang';

/** Kept in memory too, so the toggle still works where storage is blocked. */
let current: Lang = 'en';
const read = (): Lang => {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'hi' || v === 'en') current = v;
  } catch { /* storage blocked: use the in-memory choice */ }
  return current;
};
const subscribe = (cb: () => void) => {
  window.addEventListener('storage', cb);
  window.addEventListener(EVENT, cb);
  return () => { window.removeEventListener('storage', cb); window.removeEventListener(EVENT, cb); };
};

/**
 * The student pages' language, remembered on the device. English on the
 * server and during hydration (so the HTML matches), then the saved choice.
 */
export function useLang() {
  const lang = useSyncExternalStore(subscribe, read, () => 'en' as Lang);

  // Screen readers pick their voice from <html lang>.
  useEffect(() => { document.documentElement.lang = lang === 'hi' ? 'hi' : 'en'; }, [lang]);

  const setLang = useCallback((l: Lang) => {
    current = l;
    try { localStorage.setItem(KEY, l); } catch { /* private mode: this visit only */ }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const t = useCallback(
    (en: string, vars?: Record<string, string | number>) => translate(lang, en, vars),
    [lang],
  );

  return { lang, setLang, t };
}
