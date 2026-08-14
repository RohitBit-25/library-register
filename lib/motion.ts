import type { Transition } from 'framer-motion';

/**
 * Spring presets, in one place.
 *
 * The CSS easings are already tokens in globals.css (`--ease-out`,
 * `--ease-drawer`). The JS springs were not: eighteen call sites each wrote
 * their own `stiffness`/`damping` pair, and measuring the damping ratio of
 * every one of them —
 *
 *     ratio = damping / (2 · √(stiffness · mass))    (mass defaults to 1)
 *
 * — gave 0.38 to 0.80. Every value under 1.0 overshoots. Nothing in the app
 * was critically damped, so every dialog, dropdown, list row and button press
 * wobbled slightly past its target and settled back. Individually invisible;
 * collectively it is why the interface felt loose.
 *
 * Apple's rule (Designing Fluid Interfaces): default to critically damped,
 * and spend bounce only where the user's own gesture carried momentum into
 * the animation — a flick, a throw, a drag release. Overshoot on a menu that
 * merely appeared reads as noise; overshoot on a sheet you threw reads as
 * physics.
 *
 * Expressed as `bounce` + `duration`, which is framer-motion's mapping of
 * Apple's damping + response, rather than stiffness/damping — the two numbers
 * a person can actually reason about.
 */

/**
 * Anything that simply appears, changes state, or repositions: dialogs,
 * dropdowns, popovers, list rows, page sections, button presses.
 *
 * `bounce: 0` is critically damped — reaches the target and stops.
 */
export const springUI: Transition = { type: 'spring', bounce: 0, duration: 0.35 };

/** The same character, quicker — for small, frequently-seen elements. */
export const springQuick: Transition = { type: 'spring', bounce: 0, duration: 0.22 };

/**
 * Sheets and drawers. Apple ships damping 0.8 / response 0.3 here: these are
 * dragged, so a little overshoot on release matches the momentum the hand put
 * in. The only preset with bounce, and only for surfaces you can grab.
 */
export const springSheet: Transition = { type: 'spring', bounce: 0.18, duration: 0.32 };

/**
 * A gesture release — drag-to-dismiss, flick. Hand the pointer's release
 * velocity in as `velocity` so the animation continues at the speed the
 * finger was moving and there is no seam between dragging and animating.
 */
export const springThrow = (velocity = 0): Transition => ({
  type: 'spring', bounce: 0.2, duration: 0.4, velocity,
});

/**
 * Stagger for a list appearing as a group. 30–80ms reads as one motion;
 * beyond that the last row is visibly waiting its turn.
 */
export const STAGGER_SECONDS = 0.045;

/**
 * Where a flick would come to rest, if you let it decelerate.
 *
 * Apple's projection function from *Designing Fluid Interfaces*. A gesture
 * should be resolved against where it was **going**, not where the finger
 * happened to lift: releasing a sheet at 40% travel but moving fast downward
 * means dismiss, and snapping to the nearer of the two edges from the release
 * point alone gets that backwards.
 *
 * Deliberately not the textbook `v²/(2·a)` — that is a different curve and
 * does not match the deceleration users have learned from every native
 * scroll view.
 *
 * @param velocity   px per second at release
 * @param deceleration 0.998 is the normal scroll feel; 0.99 is snappier
 * @returns distance in px the motion would still travel
 */
export function projectMomentum(velocity: number, deceleration = 0.998): number {
  return (velocity / 1000) * deceleration / (1 - deceleration);
}

/**
 * Should a dragged sheet close?
 *
 * Combines position and velocity the way a physical object behaves: a slow
 * drag past the midpoint closes, and so does a fast flick from anywhere —
 * because the flick's projected endpoint is past the threshold even though
 * the finger let go early.
 *
 * @param offset    px dragged down from the open position
 * @param velocity  px/s at release (positive = downward)
 * @param height    sheet height in px
 */
export function shouldDismissSheet(offset: number, velocity: number, height: number): boolean {
  // An upward flick always means "keep it", whatever the offset.
  if (velocity < -300) return false;
  const projected = offset + projectMomentum(velocity);
  return projected > height / 2;
}
