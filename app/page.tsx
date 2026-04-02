'use client';

import { Suspense } from 'react';
import SeatGridContent from './SeatGridContent';

export default function SeatGridPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[var(--saffron-500)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SeatGridContent />
    </Suspense>
  );
}
