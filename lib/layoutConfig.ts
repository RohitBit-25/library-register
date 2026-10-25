// Geometry types live here, in the data layer, so nothing in lib/ has to pull
// in React to know where a seat is.
export type FaceDir = 'up' | 'down' | 'left' | 'right';

export interface SeatPosition {
  /** Desk top-left on the plan canvas, in px. */
  x: number;
  y: number;
  /** Which way the person sitting there faces (the chair is behind them). */
  face: FaceDir;
}

/**
 * The reading hall, from the owner's seat-numbering data (2026-10-25).
 *
 * Every list runs top to bottom (columns) or left to right (bottom row);
 * pairs are [left desk, right desk]. Seats 21 and 22 do not exist — the hall
 * has 93 seats numbered 1–95.
 *
 *   ┌──────── AC ─────────────────── AC ─────────────────┐
 *   │95  79  70 61   52 42   32 20                 10   │
 *   │94  78  69 60   51 41   31 19                  9   │
 *   │ …   …   …       …       …                     …   │
 *   │85  71  62 53   43 33   23 11                  1   │
 *   │  84 83 82 81 80              [door]               │
 *   └────────────────────────────────────────────────────┘
 */
export const SEAT_LAYOUT = {
  leftWall: [95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85],
  col2: [79, 78, 77, 76, 75, 74, 73, 72, 71],
  col3Pairs: [[70, 61], [69, 60], [68, 59], [67, 58], [66, 57], [65, 56], [64, 55], [63, 54], [62, 53]],
  col4Pairs: [[52, 42], [51, 41], [50, 40], [49, 39], [48, 38], [47, 37], [46, 36], [45, 35], [44, 34], [43, 33]],
  col5Pairs: [[32, 20], [31, 19], [30, 18], [29, 17], [28, 16], [27, 15], [26, 14], [25, 13], [24, 12], [23, 11]],
  rightWall: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  bottomRow: [84, 83, 82, 81, 80],
} as const;

// ─── Canvas geometry (px) ───────────────────────────────────────────
//
// 1600 × 1200 canvas as specified. Column x-positions follow the drawing —
// the spec's own numbers put Column 3 and Column 4 ten pixels apart, which
// the drawing does not, and the spec says to adjust where needed.

export const ROOM = { WIDTH: 1600, HEIGHT: 1200, WALL: 18 };
export const DESK_W = 84;
export const DESK_H = 70;
/**
 * Chairs sit beside their desks (left/right), so rows only need a hairline
 * gap — the desks of a column read as one long table. A chair is 48px along
 * the row, inside the 80px pitch, so neighbouring chairs never touch.
 */
export const CHAIR = { W: 48, D: 28, GAP: 4 };
export const ROW_PITCH = 80;
export const START_Y = 140;

/**
 * Desk x-positions, laid out so every aisle between chair edges is the same
 * 88px: wall desk + chair | chair + Column 2 | chair + table + chair (×3) |
 * chair + wall desk, with 40px to each wall.
 */
export const COLUMN_X = {
  leftWall: 58,
  col2: 294,
  col3: 498,
  col4: 818,
  col5: 1138,
  rightWall: 1458,
};
export const BOTTOM_ROW = { x: 228, y: 1080 };
/** Top-wall air conditioners (centre x) and the bottom-wall door. */
export const AC_CENTERS = [422, 1238];
export const DOOR = { cx: 880, w: 176 };

// ─── Seat table, built once from the lists above ────────────────────

export interface SeatGroup {
  id: string;
  label: string;
  /** Seats in reading order: top to bottom, left to right within a pair. */
  seats: number[];
}

export const SEAT_GROUPS: SeatGroup[] = [
  { id: 'leftWall', label: 'Left wall', seats: [...SEAT_LAYOUT.leftWall] },
  { id: 'col2', label: 'Column 2', seats: [...SEAT_LAYOUT.col2] },
  { id: 'col3', label: 'Column 3', seats: SEAT_LAYOUT.col3Pairs.flat() },
  { id: 'col4', label: 'Column 4', seats: SEAT_LAYOUT.col4Pairs.flat() },
  { id: 'col5', label: 'Column 5', seats: SEAT_LAYOUT.col5Pairs.flat() },
  { id: 'rightWall', label: 'Right wall', seats: [...SEAT_LAYOUT.rightWall] },
  { id: 'bottomRow', label: 'Bottom row', seats: [...SEAT_LAYOUT.bottomRow] },
];

interface SeatInfo extends SeatPosition {
  group: SeatGroup;
  /** The seat sharing the table, for the paired columns. */
  partner: number | null;
}

const SEATS = new Map<number, SeatInfo>();
{
  const group = (id: string) => SEAT_GROUPS.find((g) => g.id === id)!;
  const rowY = (i: number) => START_Y + i * ROW_PITCH;
  SEAT_LAYOUT.leftWall.forEach((n, i) =>
    SEATS.set(n, { x: COLUMN_X.leftWall, y: rowY(i), face: 'left', group: group('leftWall'), partner: null }));
  // Column 2: chair on the left, facing right.
  SEAT_LAYOUT.col2.forEach((n, i) =>
    SEATS.set(n, { x: COLUMN_X.col2, y: rowY(i), face: 'right', group: group('col2'), partner: null }));
  for (const [key, pairs] of [['col3', SEAT_LAYOUT.col3Pairs], ['col4', SEAT_LAYOUT.col4Pairs], ['col5', SEAT_LAYOUT.col5Pairs]] as const) {
    pairs.forEach(([l, r], i) => {
      const x = COLUMN_X[key];
      // The pair faces each other across the joined table: the left desk's
      // chair is on the outer left, the right desk's on the outer right.
      SEATS.set(l, { x, y: rowY(i), face: 'right', group: group(key), partner: r });
      SEATS.set(r, { x: x + DESK_W, y: rowY(i), face: 'left', group: group(key), partner: l });
    });
  }
  SEAT_LAYOUT.rightWall.forEach((n, i) =>
    SEATS.set(n, { x: COLUMN_X.rightWall, y: rowY(i), face: 'right', group: group('rightWall'), partner: null }));
  SEAT_LAYOUT.bottomRow.forEach((n, i) =>
    SEATS.set(n, { x: BOTTOM_ROW.x + i * DESK_W, y: BOTTOM_ROW.y, face: 'down', group: group('bottomRow'), partner: null }));
}

/** Every real seat number, ascending (1–95 without 21 and 22). */
export const SEAT_NUMBERS: number[] = [...SEATS.keys()].sort((a, b) => a - b);
export const SEAT_COUNT = SEAT_NUMBERS.length;

/** The box a seat's chair occupies: behind the person, clear of the desk. */
export function chairRect(n: number): { x: number; y: number; w: number; h: number } {
  const s = SEATS.get(n);
  if (!s) return { x: 0, y: 0, w: 0, h: 0 };
  const { W, D, GAP } = CHAIR;
  switch (s.face) {
    case 'down': return { x: s.x + (DESK_W - W) / 2, y: s.y - GAP - D, w: W, h: D };
    case 'up': return { x: s.x + (DESK_W - W) / 2, y: s.y + DESK_H + GAP, w: W, h: D };
    case 'left': return { x: s.x + DESK_W + GAP, y: s.y + (DESK_H - W) / 2, w: D, h: W };
    case 'right': return { x: s.x - GAP - D, y: s.y + (DESK_H - W) / 2, w: D, h: W };
  }
}

/** True for a number that is a seat in the hall. */
export function isSeat(n: number): boolean {
  return SEATS.has(n);
}

/** Where a seat sits on the plan, and which way the person faces. */
export function getSeatPositionConfig(n: number): SeatPosition {
  const s = SEATS.get(n);
  return s ? { x: s.x, y: s.y, face: s.face } : { x: 0, y: 0, face: 'down' };
}

export type SeatRowLabel = string;

/** The group a seat belongs to, as named on the owner's plan. */
export function seatRow(n: number): SeatRowLabel {
  return SEATS.get(n)?.group.label ?? '';
}

/** The seat sharing a table with `n`, or null for single desks. */
export function partnerSeat(n: number): number | null {
  return SEATS.get(n)?.partner ?? null;
}

/**
 * The seat nearest to `from` in the given direction, or null at the edge.
 *
 * Measured on the plan, not by seat number, so the arrow keys move the way
 * the eye does. Up/down stays within the same column; left/right stays on
 * the same row band and crosses tables and aisles.
 */
export function nextSeatInDirection(
  from: number,
  dir: FaceDir,
  seats: number[]
): number | null {
  const o = SEATS.get(from);
  if (!o) return null;
  const ox = o.x + DESK_W / 2, oy = o.y + DESK_H / 2;
  const alongX = dir === 'left' || dir === 'right';
  const sign = dir === 'right' || dir === 'down' ? 1 : -1;

  let best: number | null = null;
  let bestScore = Infinity;
  for (const seat of seats) {
    if (seat === from) continue;
    const p = SEATS.get(seat);
    if (!p) continue;
    const px = p.x + DESK_W / 2, py = p.y + DESK_H / 2;
    const travel = (alongX ? px - ox : py - oy) * sign;
    if (travel <= 0) continue;
    const sideways = Math.abs(alongX ? py - oy : px - ox);
    if (sideways > (alongX ? DESK_H / 2 : DESK_W / 2)) continue;
    const score = travel * 100 + sideways;
    if (score < bestScore) { bestScore = score; best = seat; }
  }
  return best;
}

/**
 * What is actually true about a seat's position, derived from the plan —
 * only claims a student can check by walking in.
 */
export function seatAmenities(n: number): string[] {
  const s = SEATS.get(n);
  if (!s) return [];
  const cx = s.x + DESK_W / 2;
  const out: string[] = [];
  if (s.y < START_Y + 2 * ROW_PITCH && AC_CENTERS.some((ac) => Math.abs(cx - ac) < 180)) {
    out.push('Near the air conditioning');
  }
  if (s.group.id === 'leftWall' || s.group.id === 'rightWall') out.push('Wall desk, facing the wall');
  if (s.y + DESK_H > ROOM.HEIGHT - 260 && Math.abs(cx - DOOR.cx) < 320) out.push('Near the entrance');
  if (s.partner) out.push(`Faces seat ${s.partner} across the table`);
  else out.push('Single desk');
  return out;
}
