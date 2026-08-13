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
  CELL: 76,
  PAD: 48,
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
    { col: 13, row: 12 },
    { col: 1, row: 12 },
  ],
};

export function getSeatPositionConfig(n: number): SeatPosition {
  if (n >= 1 && n <= 10) return { x: 1, y: 2 + (n - 1), face: 'right' };
  if (n >= 11 && n <= 20) return { x: 3, y: 3 + (n - 11), face: 'left' };
  if (n === 21) return { x: 3, y: 2, face: 'down' };
  if (n === 22) return { x: 4, y: 2, face: 'down' };
  if (n >= 23 && n <= 32) return { x: 4, y: 3 + (n - 23), face: 'right' };
  if (n >= 33 && n <= 42) return { x: 6, y: 2 + (n - 33), face: 'left' };
  if (n >= 43 && n <= 52) return { x: 7, y: 2 + (n - 43), face: 'right' };
  if (n >= 80 && n <= 84) return { x: 10 + (n - 80), y: 1, face: 'down' };
  if (n >= 53 && n <= 55) return { x: 9, y: 10 + (n - 53), face: 'left' };
  if (n >= 56 && n <= 61) return { x: 9, y: 3 + (n - 55), face: 'left' };
  if (n >= 62 && n <= 70) return { x: 10, y: 3 + (n - 61), face: 'right' };
  if (n >= 71 && n <= 79) return { x: 12, y: 3 + (n - 71), face: 'left' };
  if (n >= 85 && n <= 95) return { x: 14, y: 1 + (n - 84), face: 'left' };
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
    // Travel dominates; sideways only breaks ties within the same step.
    const score = travel * 100 + sideways;
    if (score < bestScore) {
      bestScore = score;
      best = seat;
    }
  }
  return best;
}
