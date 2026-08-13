'use client';

import { useEffect, useRef } from 'react';
import { SeatMapCanvas } from '@alisaitteke/seatmap-canvas';
import '@alisaitteke/seatmap-canvas/dist/seatmap.canvas.css';

/**
 * The shapes this wrapper actually touches. @alisaitteke/seatmap-canvas ships
 * no useful types, and `any` here meant a typo in the data shape surfaced as a
 * blank canvas at runtime rather than an error at build time.
 */
export type SeatmapSeat = { id: string; [key: string]: unknown };
export type SeatmapData = { blocks: unknown[] } | unknown[];

/** The library declares its config class but does not export it. */
type SeatmapConfig = ConstructorParameters<typeof SeatMapCanvas>[1];

/** Callers override a handful of nested style keys, not whole style objects. */
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

type SeatmapInstance = {
  setData: (data: SeatmapData) => void;
  addEventListener?: (event: string, handler: (seat: SeatmapSeat) => void) => void;
};

export default function SeatmapCanvasWrapper({
  data,
  options,
  onSeatClick,
}: {
  data: SeatmapData;
  // The library types this as a fully-populated DefaultsModel, but it merges
  // over its own defaults at runtime, so a partial override is what callers
  // actually pass.
  options?: DeepPartial<SeatmapConfig>;
  onSeatClick?: (seat: SeatmapSeat) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const seatmapRef = useRef<SeatmapInstance | null>(null);

  // The click handler is read once on mount; keeping it in a ref means a new
  // inline callback on every parent render does not tear down and rebuild the
  // canvas. Written in an effect, not during render.
  const onSeatClickRef = useRef(onSeatClick);
  useEffect(() => { onSeatClickRef.current = onSeatClick; }, [onSeatClick]);
  const optionsRef = useRef(options);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const instance = new SeatMapCanvas(
      container,
      (optionsRef.current || {}) as SeatmapConfig
    ) as unknown as SeatmapInstance;
    seatmapRef.current = instance;
    instance.addEventListener?.('seat_click', (seat) => onSeatClickRef.current?.(seat));

    return () => {
      // Captured above — containerRef.current may already be null by cleanup.
      container.innerHTML = '';
      seatmapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (seatmapRef.current && data) seatmapRef.current.setData(data);
  }, [data]);

  return <div ref={containerRef} className="w-full h-full" />;
}
