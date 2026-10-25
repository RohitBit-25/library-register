import { SEAT_NUMBERS, SEAT_COUNT, getSeatPositionConfig } from './layoutConfig.ts';
import type { FaceDir } from './layoutConfig.ts';

// Desk geometry lives in lib/layoutConfig.ts with the seat table; this keeps
// the helpers the plan and the self-check share.

/** Seats in the hall (93 — numbers 1–95 without 21 and 22). */
export const TOTAL_SEATS = SEAT_COUNT;

export interface SeatSlot {
  seat: number;
  x: number;
  y: number;
  face: FaceDir;
}

/** Every real seat with its desk position on the canvas. */
export function allSeatSlots(): SeatSlot[] {
  return SEAT_NUMBERS.map((seat) => ({ seat, ...getSeatPositionConfig(seat) }));
}

export {
  ROOM, DESK_W, DESK_H, CHAIR, COLUMN_X, BOTTOM_ROW, AC_CENTERS, DOOR,
} from './layoutConfig.ts';
