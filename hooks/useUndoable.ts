'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/useToast';

/** How long an action waits for "Undo" before it is saved. */
const UNDO_MS = 5000;

/**
 * Do something after a short grace period, with an Undo button meanwhile.
 *
 * The action is *held*, not sent and then reversed: marking a fee paid writes
 * a Payment row, and the ledger is append-only, so "undo" after the fact
 * would mean correction rows in Collections. Callers show the change on
 * screen at once (useMembers().preview) and `onUndo` puts it back.
 *
 * Held actions are sent immediately if the tab is hidden or the page is left,
 * so leaving never drops a change.
 */
export function useUndoable() {
  const { addToast } = useToast();
  const held = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; run: () => void }>());

  useEffect(() => {
    const map = held.current;
    const flush = () => {
      for (const h of map.values()) { clearTimeout(h.timer); h.run(); }
      map.clear();
    };
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
      flush(); // navigating within the app: send now
    };
  }, []);

  return useCallback((key: string, message: string, run: () => void, onUndo: () => void) => {
    const prev = held.current.get(key);
    if (prev) { clearTimeout(prev.timer); prev.run(); }
    const timer = setTimeout(() => { held.current.delete(key); run(); }, UNDO_MS);
    held.current.set(key, { timer, run });
    addToast('success', message, {
      label: 'Undo',
      onClick: () => {
        const h = held.current.get(key);
        if (!h) return; // already saved
        clearTimeout(h.timer);
        held.current.delete(key);
        onUndo();
      },
    });
  }, [addToast]);
}
