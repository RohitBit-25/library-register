// Geometry types live here, in the data layer, so nothing in lib/ has to pull
// in React to know where a seat is.
export type FaceDir = 'up' | 'down' | 'left' | 'right';

export interface SeatPosition {
  /** Desk column, 1–10 — two per row (island), left to right. */
  x: number;
  /** Desk row within the island, 1–10, top to bottom. */
  y: number;
  /** Which way the person sitting there faces. */
  face: FaceDir;
}

export interface WallDetail {
  label: string;
  /** First and last desk column (top/bottom walls) or desk row (side walls). */
  start: number;
  end: number;
  wall: 'top' | 'bottom' | 'left' | 'right';
  type: 'window' | 'ac';
}

/**
 * The reading hall, as the owner drew it (2026-10-25).
 *
 * Five islands of desks, Row A to Row E, each two desks wide with the chairs
 * on the outside, so the two people at a row of the island sit facing each
 * other across the joined desks. Rows A–D are ten desks deep; Row E is eight
 * on the left and seven on the right, which is what brings the hall to 95.
 * The entrance is centred on the top wall; windows on both side walls and
 * the bottom wall; an air conditioner at each end of the bottom wall.
 *
 *   ROW A      ROW B      ROW C      ROW D      ROW E
 *    1 │11     21 │31     41 │51     61 │71     81 │89
 *    2 │12     22 │32     42 │52     62 │72     82 │90
 *    …          …          …          …          …
 *                                               88 │95
 *   10 │20     30 │40     50 │60     70 │80
 *
 * Numbering runs down the left column of an island, then down the right.
 */
export const LAYOUT_CONFIG = {
  /** Desk columns (5 islands × 2) and the deepest island's desk rows. */
  COLS: 10,
  ROWS: 10,
  WALL_DETAILS: [
    { label: 'Window', start: 2, end: 4, wall: 'left', type: 'window' },
    { label: 'Window', start: 6, end: 8, wall: 'left', type: 'window' },
    { label: 'Window', start: 2, end: 4, wall: 'right', type: 'window' },
    { label: 'Window', start: 6, end: 8, wall: 'right', type: 'window' },
    { label: 'Window', start: 4, end: 5, wall: 'bottom', type: 'window' },
    { label: 'Window', start: 6, end: 7, wall: 'bottom', type: 'window' },
    { label: 'AC', start: 1, end: 2, wall: 'bottom', type: 'ac' },
    { label: 'AC', start: 9, end: 10, wall: 'bottom', type: 'ac' },
  ] as WallDetail[],
  /** The entrance sits over island C (desk columns 5–6). */
  ENTRANCE_COLS: [5, 6] as const,
};

/**
 * The islands, each one lettered row of the plan. `first`/`last` are seat
 * numbers; `leftCount` is how many desks run down the left column before the
 * numbering continues down the right.
 */
export const SEAT_ROWS = [
  { label: 'Row A', letter: 'A', first: 1, last: 20, leftCount: 10 },
  { label: 'Row B', letter: 'B', first: 21, last: 40, leftCount: 10 },
  { label: 'Row C', letter: 'C', first: 41, last: 60, leftCount: 10 },
  { label: 'Row D', letter: 'D', first: 61, last: 80, leftCount: 10 },
  { label: 'Row E', letter: 'E', first: 81, last: 95, leftCount: 8 },
] as const;

export type SeatRowLabel = (typeof SEAT_ROWS)[number]['label'];

/** Which lettered row (island) a seat belongs to. */
export function seatRow(n: number): SeatRowLabel {
  const row = SEAT_ROWS.find((r) => n >= r.first && n <= r.last);
  // Unreachable for seats 1–95; falling back keeps a bad seat number visible
  // rather than dropping it out of the list entirely.
  return (row ?? SEAT_ROWS[0]).label;
}

/** Where each seat sits on the grid, and which way the person faces. */
export function getSeatPositionConfig(n: number): SeatPosition {
  const island = SEAT_ROWS.findIndex((r) => n >= r.first && n <= r.last);
  if (island === -1) return { x: 1, y: 1, face: 'right' };
  const r = SEAT_ROWS[island];
  const i = n - r.first;
  const onLeft = i < r.leftCount;
  return {
    x: island * 2 + (onLeft ? 1 : 2),
    y: onLeft ? i + 1 : i - r.leftCount + 1,
    // Chairs are on the outside of the island, so the left column faces
    // right (towards its partner) and the right column faces left.
    face: onLeft ? 'right' : 'left',
  };
}

/**
 * How far off the travel line a candidate may sit, in grid cells.
 *
 * Up/down stay in their own column — any drift there jumps across an aisle
 * into the next island. Left/right may drift one row, so stepping across from
 * Row D into Row E's shorter right column still lands somewhere.
 */
const MAX_DRIFT_ACROSS = 1;
const MAX_DRIFT_ALONG_COLUMN = 0;

/**
 * The seat nearest to `from` in the given direction, or null at the edge.
 *
 * Arrow keys move the way the eye does — across the plan — not in seat-number
 * order, which jumps from the bottom of one column to the top of the next.
 * Candidates are ranked by distance along the travel axis first, then by
 * sideways offset.
 */
export function nextSeatInDirection(
  from: number,
  dir: FaceDir,
  seats: number[]
): number | null {
  const origin = getSeatPositionConfig(from);
  const alongX = dir === 'left' || dir === 'right';
  const sign = dir === 'right' || dir === 'down' ? 1 : -1;

  let best: number | null = null;
  let bestScore = Infinity;

  for (const seat of seats) {
    if (seat === from) continue;
    const p = getSeatPositionConfig(seat);
    const travel = (alongX ? p.x - origin.x : p.y - origin.y) * sign;
    if (travel <= 0) continue;
    const sideways = Math.abs(alongX ? p.y - origin.y : p.x - origin.x);
    if (sideways > (alongX ? MAX_DRIFT_ACROSS : MAX_DRIFT_ALONG_COLUMN)) continue;
    // Travel dominates; sideways only breaks ties within the same step.
    const score = travel * 100 + sideways;
    if (score < bestScore) {
      bestScore = score;
      best = seat;
    }
  }
  return best;
}

/**
 * What is actually true about a seat's position, derived from the plan.
 *
 * Deliberately conservative: a seat is "next to a window" only when it is the
 * outer column against that wall, or the bottom desk under a bottom-wall
 * window — a claim a student can check by walking in.
 */
export function seatAmenities(n: number): string[] {
  const { x, y } = getSeatPositionConfig(n);
  const { COLS, WALL_DETAILS, ENTRANCE_COLS } = LAYOUT_CONFIG;
  const island = SEAT_ROWS[Math.ceil(x / 2) - 1];
  const deepest = x % 2 === 1 ? island.leftCount : island.last - island.first + 1 - island.leftCount;
  const out: string[] = [];

  for (const d of WALL_DETAILS) {
    let near = false;
    if (d.wall === 'left') near = x === 1 && y >= d.start - 1 && y <= d.end + 1;
    else if (d.wall === 'right') near = x === COLS && y >= d.start - 1 && y <= d.end + 1;
    else if (d.wall === 'bottom') near = y >= deepest - 1 && x >= d.start && x <= d.end;
    if (!near) continue;
    const label = d.type === 'window' ? 'Next to a window' : 'Near the air conditioning';
    if (!out.includes(label)) out.push(label);
  }

  if (y <= 2 && x >= ENTRANCE_COLS[0] && x <= ENTRANCE_COLS[1]) out.push('Near the entrance');
  else if (y >= 3) out.push('Away from the door');

  const across = partnerSeat(n);
  out.push(across ? `Shares a double desk with seat ${across}` : 'No one sitting opposite');
  return out;
}

/** The seat directly across the joined desk, or null (Row E's last left desk). */
export function partnerSeat(n: number): number | null {
  const island = SEAT_ROWS.find((r) => n >= r.first && n <= r.last);
  if (!island) return null;
  const i = n - island.first;
  const rightCount = island.last - island.first + 1 - island.leftCount;
  if (i < island.leftCount) return i < rightCount ? island.first + island.leftCount + i : null;
  return island.first + (i - island.leftCount);
}
