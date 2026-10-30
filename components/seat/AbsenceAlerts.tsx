'use client';

import { useMemo } from 'react';
import { MessageCircle, UserX } from 'lucide-react';
import { type Member } from '@/lib/types';
import { addDaysISO, todayLocalISO } from '@/lib/seat-status';
import { firstName } from '@/lib/utils';

/** Absent this many recorded days in a row before staff are told. */
const STREAK = 5;

/**
 * Members who have stopped coming. They are the likeliest not to renew, and
 * a word now costs less than an empty desk later.
 *
 * Counts only days the library recorded attendance at all — a day with no
 * record (closed, or nobody marked it) is not held against anyone.
 */
export default function AbsenceAlerts({ members, history }: {
  members: Member[];
  history: { date: string; seats: number[] }[];
}) {
  const away = useMemo(() => {
    const today = todayLocalISO();
    // Most recent recorded days first, not counting today (it is still going).
    const days = history.filter((h) => h.date < today).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
    if (days.length < STREAK) return [];
    return members
      .filter((m) => !m.vacant && m.joinDate && m.joinDate <= addDaysISO(today, -STREAK))
      .map((m) => {
        let missed = 0;
        for (const d of days) {
          if (d.date < m.joinDate) break;
          if (d.seats.includes(m.seat)) break;
          missed++;
        }
        const last = days.find((d) => d.seats.includes(m.seat))?.date ?? null;
        return { m, missed, last };
      })
      .filter((x) => x.missed >= STREAK)
      .sort((a, b) => b.missed - a.missed);
  }, [members, history]);

  if (away.length === 0) return null;

  return (
    <section aria-labelledby="away-h" className="mb-6 rounded-[var(--radius-lg)] border border-[var(--marigold-200)] bg-[var(--marigold-50)] p-4 sm:p-5">
      <h2 id="away-h" className="flex items-center gap-2 text-sm font-semibold text-[var(--marigold-800)]">
        <UserX className="size-4" aria-hidden="true" />
        Not seen for {STREAK}+ days · {away.length}
      </h2>
      <p className="mt-1 text-xs text-[var(--marigold-800)]">Likely not to renew — a quick message now helps.</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {away.slice(0, 8).map(({ m, missed, last }) => (
          <li key={m.seat} className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--bg-surface)] px-3 py-2 shadow-[var(--shadow-xs)]">
            <span className="font-mono text-xs font-bold text-[var(--text-tertiary)]">#{m.seat}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{m.name}</span>
              <span className="block text-xs text-[var(--text-secondary)]">
                {missed} days away{last ? ` · last came ${last.slice(8)}/${last.slice(5, 7)}` : ''}
              </span>
            </span>
            {m.phone && (
              <a
                href={`https://wa.me/91${m.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${firstName(m.name)}, we've missed you at Gangaur Library (seat ${m.seat}). Your desk is kept for you — see you soon!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Message ${m.name} on WhatsApp`}
                className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--emerald-200)] bg-[var(--emerald-50)] text-[var(--emerald-700)] hover:bg-[var(--emerald-100)]"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
