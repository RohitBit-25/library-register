'use client';

import { useEffect, useRef } from 'react';
import { animate, stagger, utils } from 'animejs';
import { LAYOUT_CONFIG, getSeatPositionConfig } from '@/lib/layoutConfig';

const { COLS, ROWS } = LAYOUT_CONFIG;
const CENTRE = { x: (COLS + 1) / 2, y: (ROWS + 1) / 2 };

/** How far a seat sits from the middle of the room. */
function distanceFromCentre(seat: number): number {
  const { x, y } = getSeatPositionConfig(seat);
  return Math.hypot(x - CENTRE.x, y - CENTRE.y);
}

/**
 * Reveals the seat map outward from the centre of the room.
 *
 * anime.js rather than framer-motion (which the rest of the app uses for
 * gestures) because this is a position-driven stagger across ~95 nodes, which
 * is what anime's engine is built for.
 *
 * Note it does NOT use anime's `stagger(..., { grid })`: that option derives a
 * cell from each element's *index in the NodeList*, assuming row-major order.
 * This floor plan is irregular — getSeatPositionConfig scatters seats around
 * desks and walls — so an index-based grid would radiate from the wrong point
 * and read as arbitrary. The delay is computed from each seat's real x/y.
 */
export function useStaggerReveal<T extends HTMLElement>(
  /** Flip true once seats have actually rendered. */
  ready: boolean,
  /**
   * Total spread across all tiles. Deliberately short.
   *
   * The seat map is the admin's home screen — seen many times a day, which
   * puts it in the "near-imperceptible or nothing" tier, not the tier that
   * gets a showpiece reveal. This started at 420ms spread + 420ms duration
   * (~840ms end to end), which is showpiece timing on a screen someone opens
   * fifty times a shift. 160 + 240 keeps the spatial cue and gets out of the
   * way. Tiles remain clickable throughout — the reveal never blocks input.
   */
  spreadMs = 160
) {
  const containerRef = useRef<T>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    const root = containerRef.current;
    if (!ready || !root || hasRun.current) return;

    // Sorted nearest-the-centre first. anime staggers by position in the list,
    // so ordering the list radially is what makes the reveal radiate — no
    // per-element delay function needed.
    const tiles = Array.from(root.querySelectorAll<HTMLElement>('[data-seat]'))
      .sort(
        (a, b) =>
          distanceFromCentre(Number(a.dataset.seat)) -
          distanceFromCentre(Number(b.dataset.seat))
      );
    if (tiles.length === 0) return;
    hasRun.current = true;

    // The reveal is decoration. Someone who asked for less motion should not
    // have to sit through it before they can read the map.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      utils.set(tiles, { opacity: 1, scale: 1 });
      return;
    }

    const animation = animate(tiles, {
      opacity: [0, 1],
      // Never scale(0) — nothing in the real world appears from nothing.
      // 0.94 is enough to read as arrival without looking like a zoom.
      scale: [0.94, 1],
      duration: 240,
      // ease-out: entrances start fast and settle. ease-in would stall at the
      // exact moment the user is looking at the map.
      ease: 'out(3)',
      delay: stagger(spreadMs / Math.max(tiles.length, 1)),
    });

    return () => {
      animation.pause();
      // Strip anime's inline styles so hover, selection and status colours
      // aren't left fighting a stale transform.
      utils.remove(tiles);
      utils.set(tiles, { opacity: 1, scale: 1 });
    };
  }, [ready, spreadMs]);

  return containerRef;
}
