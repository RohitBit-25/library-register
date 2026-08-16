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
 * The numbering follows the physical floor plan: each column is numbered
 * sequentially from top to bottom before moving to the next column. So seats
 * 11–20 fill the left column of Block B, then 21–30 fill the right column,
 * and so on. This matches the labels on the room's actual desks, so finding a
 * seat means following one column — not hunting across a pair.
 *
 * Grid, left to right (desk columns are derived in lib/deskLayout.ts from the
 * facing directions, never declared here):
 *
 *   col  1   Row A, seats 1–10, face right → desk at col 2
 *   col  2   desk (shared by cols 1 and 3)
 *   col  3   Row B left column, seats 11–20, face left → desk at col 2
 *   col  4   Row B right column, seats 21–30, face right → desk at col 5
 *   col  5   desk (shared by cols 4 and 6)
 *   col  6   Row C left-left column, seats 31–40, face left → desk at col 5
 *   col  7   Row C left-right column, seats 41–50, face right → desk at col 8
 *   col  8   desk (shared by cols 7 and 9)
 *   col  9   Row C right-left column, seats 51–60, face left → desk at col 8
 *   col 10   Row C right-right column, seats 61–70, face right → desk at col 11
 *   col 11   desk (shared by cols 10 and 12)
 *   col 12   Row D left column, seats 77,79,81…95 (odd), face right → desk at col 13
 *   col 13   desk (shared by cols 12 and 14)
 *   col 14   Row D right column, seats 76,78,80…94 (even), face left → desk at col 13
 *
 *   row  1   top-wall run (71–75), five seats facing down
 *   rows 2–11  Row A and blocks B, C (six columns of ten)
 *   rows 3–12  Row D right block, offset one row below the top run
 */
export function getSeatPositionConfig(n: number): SeatPosition {
  // Row A — a single column against the left wall.
  if (n >= 1 && n <= 10) return { x: 1, y: 1 + n, face: 'right' };

  // Blocks B, C, and the middle section: sixty seats in six columns of ten.
  // Each column is numbered sequentially (11–20, 21–30, 31–40, 41–50, 51–60,
  // 61–70). Columns alternate facing direction so each pair shares a desk.
  if (n >= 11 && n <= 70) {
    const idx = n - 11;                         // 0–59
    const col = Math.floor(idx / 10);           // 0–5 (which column)
    const row = idx % 10;                       // 0–9 (position within column)

    // Six seat columns mapped to grid x-positions and facing directions.
    // Even-indexed columns (0, 2, 4) face LEFT toward the desk on their left.
    // Odd-indexed columns (1, 3, 5) face RIGHT toward the desk on their right.
    const colMap: { x: number; face: FaceDir }[] = [
      { x: 3,  face: 'left'  },  // col 0: seats 11–20
      { x: 4,  face: 'right' },  // col 1: seats 21–30
      { x: 6,  face: 'left'  },  // col 2: seats 31–40
      { x: 7,  face: 'right' },  // col 3: seats 41–50
      { x: 9,  face: 'left'  },  // col 4: seats 51–60
      { x: 10, face: 'right' },  // col 5: seats 61–70
    ];

    return {
      x: colMap[col].x,
      y: 2 + row,
      face: colMap[col].face,
    };
  }

  // The run along the top wall, facing the desk below it. Five seats so the
  // room reaches 95 without stranding one at the foot of a column.
  if (n >= 71 && n <= 75) return { x: 10 + (n - 71), y: 1, face: 'down' };

  // The right-hand block, offset down one row to clear the top-wall desk.
  // Odd seat numbers (77, 79 … 95) sit on the LEFT column (col 12), facing
  // right; even numbers (76, 78 … 94) sit on the RIGHT column (col 14),
  // facing left — matching the physical plan's labelling.
  if (n >= 76 && n <= 95) {
    const i = n - 76;
    const onLeft = i % 2 !== 0;          // odd index → left (seat 77, 79 …)
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
