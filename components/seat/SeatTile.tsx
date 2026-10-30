'use client';

import { memo, useState } from 'react';
import { type Member } from '@/lib/types';
import { getSeatStatus, daysUntilExpiry, fmtDateShort, cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';

import { type FaceDir } from './SeatMap';
import { STATUS_STYLE } from './statusStyle';
import { springQuick } from '@/lib/motion';

interface SeatTileProps {
  member: Member;
  onClick: (seat: number) => void;
  compact?: boolean;
  face?: FaceDir;
  selected?: boolean;
  /**
   * Outside the current filter.
   *
   * Dimming keeps the geometry of the room intact and still answers "where
   * are the morning seats" by showing them against everything else.
   */
  dimmed?: boolean;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '·';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/**
 * One seat on the admin plan.
 *
 * Three things at a glance and nothing else: the number, who (initials), and
 * state (colour, plus days when the clock matters). It used to stack a
 * progress ring, a coloured avatar disc, a clipped first name, a status edge
 * stripe and a shift glyph into 56px — five signals competing in one square,
 * which is most of why the plan read as noise. Name, phone and dates live in
 * the hover card and the detail panel, where there is room for them.
 */
function SeatTileInner({ member, onClick, selected = false, dimmed = false }: SeatTileProps) {
  const [isHovered, setIsHovered] = useState(false);
  const status = getSeatStatus(member);
  const s = STATUS_STYLE[status];
  const days = !member.vacant ? daysUntilExpiry(member.expiry) : Infinity;


  const ariaLabel = member.vacant
    ? `Seat ${member.seat}, vacant — add a member`
    : `Seat ${member.seat}, ${member.name}, ${s.label}`;

  return (
    <LazyMotion features={domAnimation}>
      <div
        className="group relative h-full w-full"
        // A tap synthesises mouseenter, so only a real mouse gets the preview;
        // a finger goes straight to the detail panel.
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') setIsHovered(true); }}
        onPointerLeave={() => setIsHovered(false)}
      >
        <button
          type="button"
          onClick={() => !dimmed && onClick(member.seat)}
          data-seat={dimmed ? undefined : member.seat}
          tabIndex={dimmed ? -1 : undefined}
          aria-hidden={dimmed || undefined}
          aria-label={ariaLabel}
          aria-pressed={selected}
          className={cn(
            // A desk mat on the wood: occupied seats get a status-coloured mat,
            // a vacant desk is bare wood with its number burned in.
            'relative z-10 flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-[6px] border transition-ui',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#E2B97F]',
            member.vacant
              ? 'border-transparent bg-transparent text-[#5B3A1A] hover:border-[#9C7040] hover:bg-[#FFFDF8]/55'
              : cn(s.tint, s.border, s.text, 'shadow-[0_1px_2px_rgba(80,50,20,0.25)] hover:brightness-[0.98]'),
            selected && 'ring-[3px] ring-[var(--saffron-500)] ring-offset-2 ring-offset-[#DDB57A]',
            dimmed && 'seat-dimmed',
          )}
        >
          {member.vacant ? (
            <>
              <span className="text-[20px] font-semibold leading-none tabular">
                {member.seat}
              </span>
              <Plus
                className="absolute right-1 top-1 size-3 text-[var(--saffron-600)] opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
            </>
          ) : (
            <>
              <span className="text-[19px] font-semibold leading-none tabular">
                {member.seat}
              </span>
              <span className="mt-1 text-[11px] font-semibold leading-none">
                {initials(member.name)}
              </span>
              {/* Only the state that needs acting on gets a second mark — the
                  chip colour already says active. Shift lives in the filter
                  and the hover card; a dot repeated the colour. Expiring and
                  fee-due tints sit close on the ramp, so each carries its own. */}
              {status !== 'active' && (
                <span className="absolute right-1 top-0.5 font-mono text-[10px] font-semibold leading-none tabular">
                  {status === 'due' && '₹'}
                  {status === 'expiring' && `${days}d`}
                  {status === 'expired' && `−${-days}`}
                </span>
              )}
            </>
          )}
        </button>

        <AnimatePresence>
          {isHovered && !member.vacant && (
            <m.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={springQuick}
              className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2"
            >
              {/* Counter-scaled so the card reads at true size however far
                  the plan is zoomed out (SeatMapContainer sets --plan-scale). */}
              <div
                className="w-52 origin-bottom rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-floating)]"
                style={{ transform: 'scale(calc(1 / var(--plan-scale, 1)))' }}
              >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-snug text-[var(--text-primary)]">{member.name}</p>
                <span className="font-mono text-xs text-[var(--text-tertiary)] tabular">#{member.seat}</span>
              </div>
              <p className="mt-0.5 font-mono text-xs text-[var(--text-tertiary)] tabular">{member.phone || 'No phone'}</p>
              <dl className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-[var(--border-default)] pt-2.5 text-xs">
                <dt className="text-[var(--text-tertiary)]">State</dt>
                <dd className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                  <span className={cn('size-2 rounded-full', s.dot)} aria-hidden="true" />{s.label}
                </dd>
                <dt className="text-[var(--text-tertiary)]">Until</dt>
                <dd className="font-medium text-[var(--text-primary)]">
                  {fmtDateShort(member.expiry)}
                  {Number.isFinite(days) && (
                    <span className="ml-1 font-mono text-[var(--text-tertiary)] tabular">
                      ({days >= 0 ? `${days}d left` : `${-days}d over`})
                    </span>
                  )}
                </dd>
                <dt className="text-[var(--text-tertiary)]">Shift</dt>
                <dd className="font-medium capitalize text-[var(--text-primary)]">{member.shift === 'full' ? 'Full day' : member.shift}</dd>
              </dl>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}

/**
 * Hand-written comparator, because 95 of these re-render on every map change.
 *
 * CAUTION: it lists the props it cares about, so any prop added to
 * SeatTileProps and not added here is silently ignored.
 */
const SeatTile = memo(SeatTileInner, (prevProps, nextProps) => {
  const prev = prevProps.member;
  const next = nextProps.member;
  return (
    prev.seat === next.seat &&
    prev.name === next.name &&
    prev.vacant === next.vacant &&
    prev.fee === next.fee &&
    prev.expiry === next.expiry &&
    prev.shift === next.shift &&
    prev.phone === next.phone &&
    prevProps.compact === nextProps.compact &&
    prevProps.selected === nextProps.selected &&
    prevProps.dimmed === nextProps.dimmed &&
    prevProps.face === nextProps.face
  );
});

SeatTile.displayName = 'SeatTile';

export default SeatTile;
