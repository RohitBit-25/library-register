import { memo } from 'react';

/**
 * Initials avatar rendered inline as SVG.
 *
 * Replaces `https://api.dicebear.com/9.x/micah/svg?seed=<member name><seat>`,
 * which fired one third-party request per seat — 95 on a full map, on the
 * critical path — and put the member's real name in a query string sent to an
 * external host. Nothing leaves the browser now.
 */

  // Identity colours — cool and violet only, never a status hue.
//
// This palette was originally the six status colours (saffron, emerald,
// sapphire, indigo, marigold, ruby) assigned by hashing the member's name.
// On the floor plan that put a green chip on an expired member and a red one
// on a paid-up member, directly contradicting the status ring around it, and
// ninety-five of them buried the handful of seats that needed attention.
//
// Per-member colour is genuinely useful — it is how you recognise a regular
// at a glance — so it is back, drawn from hues that status never uses. Status
// on this map is warm: emerald 147deg, marigold 42deg, saffron 29deg, ruby
// 0deg. Every colour below sits at least 45deg away from all four, so a chip
// can never be mistaken for a state.
//
// White text on each clears 4.5:1, and scripts/check-contrast.py holds both
// rules on every build. A seventh colour (mulberry, 325deg) was dropped when
// that check pointed out it sits 35deg from ruby — close enough to read as
// an expired seat.
const PALETTE = [
  { bg: '#0E6FA8', fg: '#FFFFFF' }, // ocean     202deg   5.44:1
  { bg: '#155E75', fg: '#FFFFFF' }, // pine      194deg   7.27:1
  { bg: '#3F4C63', fg: '#FFFFFF' }, // slate     218deg   8.66:1
  { bg: '#4338CA', fg: '#FFFFFF' }, // indigo    245deg   7.90:1
  { bg: '#6D28D9', fg: '#FFFFFF' }, // violet    263deg   7.10:1
  { bg: '#86198F', fg: '#FFFFFF' }, // plum      295deg   8.24:1
];

/** Stable, order-independent hash so colours don't shuffle between renders. */
function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface SeatAvatarProps {
  name: string;
  seat: number;
  size?: number;
}

function SeatAvatarInner({ name, seat, size = 44 }: SeatAvatarProps) {
  const initials = getInitials(name);
  const { bg, fg } = PALETTE[hash(`${name}${seat}`) % PALETTE.length];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      role="img"
      aria-label={`${name || 'Unknown member'} avatar`}
      className="pointer-events-none shrink-0"
    >
      <circle cx="22" cy="22" r="22" fill={bg} />
      <text
        x="22"
        y="22"
        textAnchor="middle"
        dominantBaseline="central"
        fill={fg}
        fontSize={initials.length > 1 ? 17 : 20}
        fontWeight="600"
        fontFamily="var(--font-body, system-ui), sans-serif"
      >
        {initials}
      </text>
    </svg>
  );
}

export const SeatAvatar = memo(SeatAvatarInner);
SeatAvatar.displayName = 'SeatAvatar';

export default SeatAvatar;
