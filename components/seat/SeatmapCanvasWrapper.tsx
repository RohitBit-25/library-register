'use client';

import React, { useEffect, useRef } from 'react';
import { SeatMapCanvas } from '@alisaitteke/seatmap-canvas';
import '@alisaitteke/seatmap-canvas/dist/seatmap.canvas.css';

export default function SeatmapCanvasWrapper({ 
  data, 
  options, 
  onSeatClick 
}: { 
  data: any, 
  options?: any,
  onSeatClick?: (seat: any) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const seatmapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Initialize seatmap
    seatmapRef.current = new SeatMapCanvas(containerRef.current, options || {});
    
    // Set initial data
    if (data) {
      seatmapRef.current.setData(data);
    }
    
    // Add event listeners
    if (seatmapRef.current.addEventListener) {
      seatmapRef.current.addEventListener("seat_click", (seat: any) => {
         if (onSeatClick) onSeatClick(seat);
      });
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []); // Run once on mount

  // Update data when it changes
  useEffect(() => {
    if (seatmapRef.current && data) {
      seatmapRef.current.setData(data);
    }
  }, [data]);

  return <div ref={containerRef} className="w-full h-full" />;
}
