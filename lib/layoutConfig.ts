// Geometry types live here, in the data layer. They were declared in
// components/seat/SeatMap.tsx and imported back up, so the layout config
// depended on the component that renders it — meaning nothing in lib/ could
// use them without pulling in React.
export type FaceDir = 'up' | 'down' | 'left' | 'right';

export interface SeatPosition {
  x: number;
  y: number;
  face: FaceDir;
}

export interface WallDetail {
  label: string;
  start: number;
  end: number;
  wall: 'top' | 'bottom' | 'left' | 'right';
  type: 'window' | 'ac';
}

export const LAYOUT_CONFIG = {
  COLS: 14,
  ROWS: 12,
  CELL: 88,
  PAD: 64,
  WALL_DETAILS: [
    { label: 'Window', start: 1, end: 1, wall: 'bottom', type: 'window' },
    { label: 'AC', start: 3, end: 4, wall: 'bottom', type: 'ac' },
    { label: 'Window', start: 6, end: 7, wall: 'bottom', type: 'window' },
    { label: 'Window', start: 9, end: 10, wall: 'bottom', type: 'window' },
    { label: 'AC', start: 12, end: 12, wall: 'bottom', type: 'ac' },
    { label: 'Window', start: 14, end: 14, wall: 'bottom', type: 'window' },
    { label: 'Window', start: 3, end: 4, wall: 'right', type: 'window' },
    { label: 'Window', start: 11, end: 12, wall: 'right', type: 'window' },
  ] as WallDetail[],
  // FLOOR_DESKS removed: desks are now derived from seat positions in
  // lib/deskLayout.ts, so furniture cannot drift out of sync with seating.
  FLOOR_PLANTS: [
    { col: 1, row: 1 },
    { col: 1, row: 12 },
    { col: 9, row: 12 },
  ],
};

/**
 * Where each seat sits on the grid, and which way the person faces.
 *
 * **The rule, everywhere on the plan: the lower number of a pair sits on the
 * left, its successor directly across the desk on the same row.** So 11 and 12
 * are neighbours, 13 and 14 the row below, and reading the room the way you
 * read a page — left to right, top to bottom — gives 11, 12, 13, 14…
 *
 * The alternative is to run each column top-to-bottom (11–20 down the left,
 * then 21–30 down the right). Both are defensible; this one wins because a
 * person standing in the room reads across, not down: seeing 11 tells you 12
 * is the seat you can reach out and touch, not the seat ten places away.
 *
 * The scheme it replaced had no rule at all — 1–10 down one column, 11–20 two
 * columns over, then 21 and 22 dropped against a different wall entirely.
 *
 * Grid, left to right (desk columns are derived in lib/deskLayout.ts from the
 * facing directions, never declared here):
 *
 *   col  1   Row A, seats 1–10, face right → desk at col 2
 *   col  2   desk (shared by cols 1 and 3)
 *   col  3   block B, left of each pair  (11,13…29), face left  → desk col 2
 *   col  4   block B, right of each pair (12,14…30), face right → desk col 5
 *   col  5   desk (shared by cols 4 and 6)
 *   col  6   block C, left  (31,33…49), face left  → desk col 5
 *   col  7   block C, right (32,34…50), face right → desk col 8
 *   col  8   desk (shared by cols 7 and 9)
 *   col  9   block D, left  (51,53…69), face left  → desk col 8
 *   col 10   block D, right (52,54…70), face right → desk col 11
 *   col 11   desk
 *   col 12   right block, left  (76,78…94), face right → desk col 13
 *   col 13   desk (shared by cols 12 and 14)
 *   col 14   right block, right (77,79…95), face left  → desk col 13
 *
 *   row  1     top-wall run (71–75), five seats facing down
 *   rows 2–11  Row A and blocks B, C, D
 *   rows 3–12  the right block, offset one row to clear the top-wall desk
 */
export function getSeatPositionConfig(n: number): SeatPosition {
  // Row A — a single column against the left wall.
  if (n >= 1 && n <= 10) return { x: 1, y: 1 + n, face: 'right' };

  // Blocks B, C and D — twenty seats each, paired across a shared desk.
  if (n >= 11 && n <= 70) {
    const block = Math.floor((n - 11) / 20);   // 0 = B, 1 = C, 2 = D
    const i = (n - 11) % 20;                   // position within the block
    const leftCol = [3, 6, 9][block];
    const onLeft = i % 2 === 0;                // 11, 13, 15 … take the left
    return {
      x: onLeft ? leftCol : leftCol + 1,
      y: 2 + Math.floor(i / 2),
      face: onLeft ? 'left' : 'right',
    };
  }

  // The run along the top wall, facing the desk below it. Five seats, not the
  // four the sketch showed: the room holds 95 and this run is where the plan
  // has floor for the odd one, rather than stranding it at the foot of a
  // column on a row of its own.
  if (n >= 71 && n <= 75) return { x: 10 + (n - 71), y: 1, face: 'down' };

  // The right-hand block, offset down one row to clear the top-wall desk.
  // Same rule as every other block, so it starts on an even number rather than
  // an odd one — the parity is incidental, the pairing is the point.
  if (n >= 76 && n <= 95) {
    const i = n - 76;
    const onLeft = i % 2 === 0;
    return {
      x: onLeft ? 12 : 14,
      y: 3 + Math.floor(i / 2),
      face: onLeft ? 'right' : 'left',
    };
  }

  return { x: 1, y: 1, face: 'up' };
}

/**
 * The seat nearest to `from` in the given direction, or null at the edge.
 *
 * 95 seats means 95 Tab presses to reach the last one. Arrow keys need to move
 * the way the eye does — across the floor plan — not in DOM order, which
 * follows seat number and jumps across the room between runs.
 *
 * Candidates are ranked by distance along the travel axis first, then by
 * sideways offset, so a step right lands on the seat across the desk rather
 * than one diagonally away that happens to be marginally closer overall.
 */
/**
 * How far off the travel line a candidate may sit, in grid cells.
 *
 * Without this, pressing Up from seat 1 jumps to seat 80 — nine columns
 * across the room — because it is the only seat with a smaller y. Technically
 * upward, but it reads as teleporting. Two cells covers a facing pair (one
 * apart) and the next run across an aisle (two apart), and nothing further.
 */
const MAX_SIDEWAYS_DRIFT = 2;

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
    if (sideways > MAX_SIDEWAYS_DRIFT) continue;
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
 * What is actually true about a seat's position, derived from the floor plan.
 *
 * The browse page used to print the same list for every seat — "Near Window",
 * "Good Lighting", "AC Area", "Quiet Zone" — so seat 45, in the middle of the
 * room with walls on no side, advertised a window. The plan already records
 * where the windows and air conditioning are; this reads them.
 *
 * Deliberately conservative: only claims a seat is near something when it sits
 * within one cell of it. A claim a student can check by walking in is worth
 * more than a longer list.
 */
export function seatAmenities(n: number): string[] {
  const { x, y } = getSeatPositionConfig(n);
  const { COLS, ROWS, WALL_DETAILS } = LAYOUT_CONFIG;
  const out: string[] = [];

  const nearWall = {
    bottom: y >= ROWS - 2,
    right: x >= COLS - 1,
    left: x <= 1,
    top: y <= 2,
  };

  for (const d of WALL_DETAILS) {
    const along = d.wall === 'bottom' || d.wall === 'top' ? x : y;
    if (along < d.start - 1 || along > d.end + 1) continue;
    if (!nearWall[d.wall]) continue;
    const label = d.type === 'window' ? 'Next to a window' : 'Under the air conditioning';
    if (!out.includes(label)) out.push(label);
  }

  // The entrance sits above columns 6-9; seats beside it get the foot traffic.
  if (nearWall.top && x >= 5 && x <= 10) out.push('Near the entrance');
  else if (!nearWall.top && !nearWall.bottom) out.push('Away from the doors');

  if (nearWall.left || nearWall.right) out.push('Wall side, one neighbour');

  return out;
}

/**
 * The four seat runs the floor plan labels Row A–D, as grid-column ranges.
 *
 * These used to exist twice: as four hardcoded `left` offsets in SeatMap's
 * JSX, and as four hardcoded seat-number ranges in SeatList. They disagreed —
 * the plan's Row A covers seats 1–32, the list called 1–22 Row A — so a third
 * of the library had a different row name depending on which view you were
 * looking at, on a page whose whole job is helping someone find a physical
 * seat in a physical room.
 *
 * One definition, in grid columns, because that is what the room is actually
 * divided by. Both views derive from it.
 */
// Bands follow the new column layout: each covers a block and the desk beside
// it, so the label on the plan sits over the seats it names.
export const SEAT_ROWS = [
  { label: 'Row A', fromCol: 1, toCol: 2 },    // seats 1–10
  { label: 'Row B', fromCol: 3, toCol: 5 },    // seats 11–30
  { label: 'Row C', fromCol: 6, toCol: 10 },   // seats 31–70
  { label: 'Row D', fromCol: 11, toCol: 14 },  // seats 71–95
] as const;

export type SeatRowLabel = (typeof SEAT_ROWS)[number]['label'];

/** Which lettered run a seat belongs to, from its position on the plan. */
export function seatRow(n: number): SeatRowLabel {
  const { x } = getSeatPositionConfig(n);
  const row = SEAT_ROWS.find((r) => x >= r.fromCol && x <= r.toCol);
  // Every column 1–14 falls in a band, so this is unreachable for a real
  // seat; falling back to the first run keeps a bad seat number visible
  // rather than dropping it out of the list entirely.
  return (row ?? SEAT_ROWS[0]).label;
}
