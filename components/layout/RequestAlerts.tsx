'use client';

import { useEffect, useRef } from 'react';
import { useSeatRequests } from '@/hooks/useSeatRequests';
import { useToast } from '@/hooks/useToast';

const BASE_TITLE = 'Shree Gangaur Study Library';

/**
 * Tells staff a student is waiting: a toast naming the desk, the count in the
 * tab title, and a short chime. A request used to sit unseen until someone
 * happened to open Requests. Renders nothing.
 */
export default function RequestAlerts() {
  const { requests, pendingCount } = useSeatRequests();
  const { addToast } = useToast();
  const seen = useRef<Set<string> | null>(null);
  const audio = useRef<AudioContext | null>(null);

  // Browsers only allow sound after the person has interacted with the page.
  useEffect(() => {
    const unlock = () => { audio.current ??= new AudioContext(); };
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  useEffect(() => {
    const pending = requests.filter((r) => r.status === 'pending');
    const ids = new Set(pending.map((r) => String(r.id)));
    // First load is the backlog, not news.
    if (seen.current === null) { seen.current = ids; return; }
    const fresh = pending.filter((r) => !seen.current!.has(String(r.id)));
    seen.current = ids;
    if (fresh.length === 0) return;
    const r = fresh[0];
    addToast('success', fresh.length === 1
      ? `New request: desk ${r.seat} — ${r.userName}`
      : `${fresh.length} new seat requests`);
    const ctx = audio.current;
    if (ctx) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 880; g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.35);
    }
  }, [requests, addToast]);

  useEffect(() => {
    document.title = pendingCount > 0 ? `(${pendingCount}) ${BASE_TITLE}` : BASE_TITLE;
  }, [pendingCount]);

  return null;
}
