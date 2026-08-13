import { LAYOUT_CONFIG, getSeatPositionConfig } from './layoutConfig.ts';
import type { FaceDir } from './layoutConfig.ts';

// ─── Desks, derived from where the seats actually are ───────────────
//
// The floor plan previously drew four hand-placed grey rectangles from a
// FLOOR_DESKS constant that had no relationship to seat coordinates. Seats
// floated as isolated squares on empty floor and nothing read as furniture.
//
// A study library seats people at shared desks: a run of seats in the same
// column, all facing the same way, sits along one desk slab, and the slab is
// on the side they face. Deriving that from the seat positions means the
// furniture can never drift out of sync with the seating.

const { CELL, PAD } = LAYOUT_CONFIG;
export const TOTAL_SEATS = 95;
export const SEAT_SIZE = 48;

/** Desk depth in px — how far the slab extends from the seat. */
const DESK_DEPTH = Math.round(CELL * 0.42);
/** Gap between the chair and the desk edge, so they don't visually fuse. */
const CHAIR_GAP = 4;

export interface SeatSlot {
  seat: number;
  x: number;
  y: number;
  face: FaceDir;
}

export interface DeskRun {
  id: string;
  face: FaceDir;
  /** Pixel box of the desk slab. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Seat numbers sharing this desk, in order — used to draw dividers. */
  seats: number[];
  /** True when two facing rows share one table, as in a real reading hall. */
  shared?: boolean;
}

/** Every seat with its resolved grid position. */
export function allSeatSlots(): SeatSlot[] {
  return Array.from({ length: TOTAL_SEATS }, (_, i) => {
    const seat = i + 1;
    const { x, y, face } = getSeatPositionConfig(seat);
    return { seat, x, y, face };
  });
}

/** Top-left pixel of a seat's cell. */
export function seatPixel(x: number, y: number) {
  return {
    left: PAD + (x - 1) * CELL + (CELL - SEAT_SIZE) / 2,
    top: PAD + (y - 1) * CELL + (CELL - SEAT_SIZE) / 2,
  };
}

/**
 * Group seats into desk runs.
 *
 * Vertical facings (left/right) group by column and consecutive rows;
 * horizontal facings (up/down) group by row and consecutive columns. A break
 * in the sequence starts a new desk, which is what produces separate islands
 * of furniture rather than one slab down the whole room.
 */
export function deriveDeskRuns(slots: SeatSlot[] = allSeatSlots()): DeskRun[] {
  const groups = new Map<string, SeatSlot[]>();

  for (const s of slots) {
    const vertical = s.face === 'left' || s.face === 'right';
    // Group key: the axis the run travels along, plus the facing.
    const key = vertical ? `v:${s.x}:${s.face}` : `h:${s.y}:${s.face}`;
    const list = groups.get(key);
    if (list) list.push(s);
    else groups.set(key, [s]);
  }

  const runs: DeskRun[] = [];

  for (const [key, list] of groups) {
    const vertical = key.startsWith('v:');
    list.sort((a, b) => (vertical ? a.y - b.y : a.x - b.x));

    // Split into consecutive stretches.
    let chunk: SeatSlot[] = [];
    const flush = () => {
      if (chunk.length) runs.push(buildRun(chunk, vertical));
      chunk = [];
    };

    for (const s of list) {
      if (!chunk.length) { chunk = [s]; continue; }
      const prev = chunk[chunk.length - 1];
      const contiguous = vertical ? s.y === prev.y + 1 : s.x === prev.x + 1;
      if (contiguous) chunk.push(s);
      else { flush(); chunk = [s]; }
    }
    flush();
  }

  return mergeFacingPairs(runs);
}

/**
 * Merge two runs that face each other into the single desk they share.
 *
 * A reading hall seats people on both sides of one long table. Seats 1–10 face
 * right and 11–20 face left across a one-cell gap: that is one desk, not two
 * strips with an aisle between them. Drawn separately they read as free-
 * standing partitions floating in the circulation space.
 *
 * The merged slab spans from one row of chairs to the other, so the seats sit
 * *at* it rather than beside it.
 */
function mergeFacingPairs(runs: DeskRun[]): DeskRun[] {
  const out: DeskRun[] = [];
  const consumed = new Set<string>();

  for (const a of runs) {
    if (consumed.has(a.id)) continue;

    const partner = runs.find((b) => {
      if (b.id === a.id || consumed.has(b.id)) return false;
      if (!isOpposite(a.face, b.face)) return false;

      const vertical = a.face === 'left' || a.face === 'right';
      if (vertical !== (b.face === 'left' || b.face === 'right')) return false;

      // Close enough to be one table rather than two across an aisle. The
      // seats sit one cell apart, so their slabs land ~CELL/2 apart; anything
      // wider is genuinely a walkway between separate desks.
      const gap = vertical
        ? Math.max(a.left, b.left) - Math.min(a.left + a.width, b.left + b.width)
        : Math.max(a.top, b.top) - Math.min(a.top + a.height, b.top + b.height);
      if (gap < 0 || gap > CELL * 0.6) return false;

      // And they must actually overlap along the run, or they are different
      // desks that happen to be aligned.
      const overlap = vertical
        ? Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top)
        : Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
      return overlap > SEAT_SIZE / 2;
    });

    if (!partner) { out.push(a); continue; }

    consumed.add(a.id);
    consumed.add(partner.id);

    const left = Math.min(a.left, partner.left);
    const top = Math.min(a.top, partner.top);
    out.push({
      id: `${a.id}+${partner.id}`,
      face: a.face,
      left,
      top,
      width: Math.max(a.left + a.width, partner.left + partner.width) - left,
      height: Math.max(a.top + a.height, partner.top + partner.height) - top,
      seats: [...a.seats, ...partner.seats],
      shared: true,
    });
  }

  return out;
}

function isOpposite(a: FaceDir, b: FaceDir): boolean {
  return (a === 'left' && b === 'right') || (a === 'right' && b === 'left')
    || (a === 'up' && b === 'down') || (a === 'down' && b === 'up');
}

function buildRun(chunk: SeatSlot[], vertical: boolean): DeskRun {
  const first = chunk[0];
  const last = chunk[chunk.length - 1];
  const face = first.face;
  const seats = chunk.map((c) => c.seat);
  const id = `${face}-${first.seat}-${last.seat}`;

  if (vertical) {
    // Run travels down a column; slab sits to the left or right of the seats.
    const { top } = seatPixel(first.x, first.y);
    const { top: lastTop } = seatPixel(last.x, last.y);
    const height = lastTop + SEAT_SIZE - top;
    const cellLeft = PAD + (first.x - 1) * CELL;

    const left = face === 'right'
      ? cellLeft + (CELL + SEAT_SIZE) / 2 + CHAIR_GAP
      : cellLeft + (CELL - SEAT_SIZE) / 2 - CHAIR_GAP - DESK_DEPTH;

    return { id, face, left, top, width: DESK_DEPTH, height, seats };
  }

  // Run travels across a row; slab sits above or below the seats.
  const { left } = seatPixel(first.x, first.y);
  const { left: lastLeft } = seatPixel(last.x, last.y);
  const width = lastLeft + SEAT_SIZE - left;
  const cellTop = PAD + (first.y - 1) * CELL;

  const top = face === 'down'
    ? cellTop + (CELL + SEAT_SIZE) / 2 + CHAIR_GAP
    : cellTop + (CELL - SEAT_SIZE) / 2 - CHAIR_GAP - DESK_DEPTH;

  return { id, face, left, top, width, height: DESK_DEPTH, seats };
}
