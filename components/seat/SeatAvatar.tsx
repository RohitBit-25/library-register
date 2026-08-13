import { memo } from 'react';

/**
 * Initials avatar rendered inline as SVG.
 *
 * Replaces `https://api.dicebear.com/9.x/micah/svg?seed=<member name><seat>`,
 * which fired one third-party request per seat — 95 on a full map, on the
 * critical path — and put the member's real name in a query string sent to an
 * external host. Nothing leaves the browser now.
 */

// Warm neutrals only, varying in weight rather than hue.
//
// This palette used to be the six status colours — saffron, emerald,
// sapphire, indigo, marigold, ruby — assigned by hashing the member's name.
// On the floor plan that put a green chip on an expired member and a red chip
// on a paid-up one, directly contradicting the status ring drawn around it.
// Ninety-five of them turned the map into confetti and buried the six seats
// that actually needed attention.
//
// An avatar answers "who is this", never "how are they doing". The variation
// is kept because it helps recognise a regular at a glance; the hues are gone
// because only status may use hue. White on every value clears 4.5:1.
const PALETTE = [
  { bg: '#57534E', fg: '#FFFFFF' }, //  7.63:1
  { bg: '#4A443F', fg: '#FFFFFF' }, //  9.59:1
  { bg: '#6B6660', fg: '#FFFFFF' }, //  5.68:1
  { bg: '#78716C', fg: '#FFFFFF' }, //  4.80:1
  { bg: '#5F544B', fg: '#FFFFFF' }, //  7.35:1
  { bg: '#413B36', fg: '#FFFFFF' }, // 11.03:1
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
