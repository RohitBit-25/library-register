import { LAYOUT_CONFIG, SEAT_ROWS, getSeatPositionConfig } from './layoutConfig.ts';
import type { FaceDir } from './layoutConfig.ts';

// ─── The hall in pixels ─────────────────────────────────────────────
//
// Canvas units, drawn at scale 1 and shrunk to fit by SeatMapContainer.
// Proportions follow the owner's reference drawing: a wide room, five desk
// islands, each desk a near-square tile with the seat number on its top.

export const TOTAL_SEATS = 95;

export const ROOM = {
  WIDTH: 1500,
  HEIGHT: 980,
  /** Wall thickness, drawn inside the canvas edge. */
  WALL: 14,
};

/** One desk top. Desks in a column touch, like one long table with seams. */
export const DESK_W = 76;
export const DESK_H = 64;
/** How far a chair sticks out from its desk. */
export const CHAIR_DEPTH = 18;

/** Left edge of each island's left column; its right column is flush beside it. */
export const ISLAND_X = [128, 398, 668, 938, 1208];
/** Top of the first desk row. */
export const DESK_TOP = 196;

export interface SeatSlot {
  seat: number;
  x: number;
  y: number;
  face: FaceDir;
}

/** Every seat with its resolved grid position. */
export function allSeatSlots(): SeatSlot[] {
  return Array.from({ length: TOTAL_SEATS }, (_, i) => {
    const seat = i + 1;
    const { x, y, face } = getSeatPositionConfig(seat);
    return { seat, x, y, face };
  });
}

/** Top-left pixel of the desk at grid column `x`, row `y`. */
export function seatPixel(x: number, y: number) {
  const island = Math.ceil(x / 2) - 1;
  const right = x % 2 === 0;
  return {
    left: ISLAND_X[island] + (right ? DESK_W : 0),
    top: DESK_TOP + (y - 1) * DESK_H,
  };
}

/** Horizontal centre of an island, for its row label. */
export function islandCenter(island: number) {
  return ISLAND_X[island] + DESK_W;
}

/** Bottom edge of an island's deepest column. */
export function islandBottom(island: number) {
  const r = SEAT_ROWS[island];
  const depth = Math.max(r.leftCount, r.last - r.first + 1 - r.leftCount);
  return DESK_TOP + depth * DESK_H;
}

export { LAYOUT_CONFIG };
