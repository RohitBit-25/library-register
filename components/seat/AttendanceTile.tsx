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
        className="flex h-full w-full items-center justify-center rounded-[6px]"
        aria-hidden="true"
      >
        <span className="text-[18px] font-semibold text-[#8C6A44] tabular">{member.seat}</span>
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
        'group relative flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-[6px] border transition-ui',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-600)] focus-visible:ring-offset-1',
        present
          ? 'border-[var(--emerald-500)] bg-[#DDF3E4] shadow-[0_1px_2px_rgba(80,50,20,0.25)]'
          : 'border-[#CFC2AE] bg-[#FFFDF8] hover:border-[var(--emerald-500)]'
      )}
      aria-pressed={present}
      aria-label={`Seat ${member.seat}, ${member.name}. ${present ? 'Present' : 'Not marked'}. Tap to toggle.`}
    >
      <span
        className={cn(
          'absolute left-1 top-0.5 font-mono text-[10px] font-semibold tabular',
          present ? 'text-[var(--emerald-600)]' : 'text-[var(--text-disabled)]'
        )}
      >
        {member.seat}
      </span>

      {present ? (
        <Check className="size-4 text-[var(--emerald-600)]" aria-hidden="true" />
      ) : (
        <span className="size-4 rounded-full border border-dashed border-[var(--border-strong)]" aria-hidden="true" />
      )}

      <span
        className={cn(
          'mt-0.5 max-w-full truncate px-0.5 text-[10px] font-semibold leading-none',
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
