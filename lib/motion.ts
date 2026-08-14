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
