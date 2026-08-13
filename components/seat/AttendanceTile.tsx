'use client';

import { memo } from 'react';
import { type Member } from '@/lib/types';
import { cn, firstName } from '@/lib/utils';
import { Check } from 'lucide-react';

interface AttendanceTileProps {
  member: Member;
  present: boolean;
  onToggle: (seat: number) => void;
}

/**
 * A seat rendered for check-in rather than for management.
 *
 * Attendance is the only task performed ~60 times a day, and it previously
 * meant leaving the floor plan for a separate list. The map already knows who
 * sits where, so it makes a better register than a table does: the librarian
 * walks the room and taps the seats in front of them.
 *
 * Deliberately shows less than SeatTile — no expiry, no fee, no shift. During
 * a check-in pass the only question is "is this person here", and everything
 * else is a distraction.
 */
function AttendanceTileInner({ member, present, onToggle }: AttendanceTileProps) {
  if (member.vacant) {
    return (
      <div
        className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-muted)]/50"
        aria-hidden="true"
      >
        <span className="font-mono text-[9px] text-[var(--text-disabled)]">
          {String(member.seat).padStart(2, '0')}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onToggle(member.seat)}
      data-seat={member.seat}
      // The whole tile is the target — a 48px tile is already at the small end
      // for a finger, so there is no smaller checkbox inside it.
      className={cn(
        'group relative flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg border transition-ui',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-600)] focus-visible:ring-offset-1',
        present
          ? 'border-[var(--emerald-500)] bg-[var(--emerald-50)] shadow-[var(--shadow-sm)]'
          : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--emerald-500)]'
      )}
      aria-pressed={present}
      aria-label={`Seat ${member.seat}, ${member.name}. ${present ? 'Present' : 'Not marked'}. Tap to toggle.`}
    >
      <span
        className={cn(
          'absolute left-1 top-0.5 font-mono text-[8px] font-bold',
          present ? 'text-[var(--emerald-600)]' : 'text-[var(--text-disabled)]'
        )}
      >
        {String(member.seat).padStart(2, '0')}
      </span>

      {present ? (
        <Check className="h-4 w-4 text-[var(--emerald-600)]" aria-hidden="true" />
      ) : (
        <span className="h-4 w-4 rounded-full border border-dashed border-[var(--border-strong)]" aria-hidden="true" />
      )}

      <span
        className={cn(
          'mt-0.5 max-w-full truncate px-0.5 text-[8px] font-bold leading-none',
          present ? 'text-[var(--emerald-600)]' : 'text-[var(--text-secondary)]'
        )}
      >
        {firstName(member.name)}
      </span>
    </button>
  );
}

export const AttendanceTile = memo(
  AttendanceTileInner,
  (a, b) =>
    a.present === b.present &&
    a.member.seat === b.member.seat &&
    a.member.name === b.member.name &&
    a.member.vacant === b.member.vacant
);

export default AttendanceTile;
