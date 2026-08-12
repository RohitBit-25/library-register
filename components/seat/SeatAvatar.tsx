import { memo } from 'react';

/**
 * Initials avatar rendered inline as SVG.
 *
 * Replaces `https://api.dicebear.com/9.x/micah/svg?seed=<member name><seat>`,
 * which fired one third-party request per seat — 95 on a full map, on the
 * critical path — and put the member's real name in a query string sent to an
 * external host. Nothing leaves the browser now.
 */

// Fixed palette so a given member always gets the same colour. All values are
// -600/-700 shades, so white text on them clears 4.5:1.
const PALETTE = [
  { bg: '#A65310', fg: '#FFFFFF' }, // saffron-600
  { bg: '#15803D', fg: '#FFFFFF' }, // emerald-600
  { bg: '#0369A1', fg: '#FFFFFF' }, // sapphire-600
  { bg: '#4338CA', fg: '#FFFFFF' }, // indigo-600
  { bg: '#854D0E', fg: '#FFFFFF' }, // marigold-700
  { bg: '#B91C1C', fg: '#FFFFFF' }, // ruby-600
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
