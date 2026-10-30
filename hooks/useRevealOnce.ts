'use client';

import { useEffect, useRef } from 'react';

/**
 * Runs `play` once, when the element's top has come a fifth of the way up the
 * screen. Not a share of the element's own height: a section taller than the
 * screen (the hall bento on a phone) would never reach a 45% threshold.
 *
 * Motion is decoration: with reduced motion asked for, `play` never runs and
 * the CSS keeps everything in its finished state (globals.css § Reveal).
 * `play` may return a cleanup (e.g. pausing its anime.js timeline).
 */
export function useRevealOnce<T extends HTMLElement>(play: (root: T) => void | (() => void)) {
  const ref = useRef<T>(null);
  const playRef = useRef(play);
  useEffect(() => { playRef.current = play; });

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { root.dataset.revealed = ''; return; }
    let cleanup: void | (() => void);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      root.dataset.revealed = '';
      cleanup = playRef.current(root);
    }, { threshold: 0, rootMargin: '0px 0px -20% 0px' });
    io.observe(root);
    return () => { io.disconnect(); if (cleanup) cleanup(); };
  }, []);

  return ref;
}
