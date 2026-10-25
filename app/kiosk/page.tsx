'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMembers } from '@/hooks/useMembers';
import { useAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Delete, ArrowRight, ArrowLeft, LogIn, LogOut } from 'lucide-react';
import Wordmark from '@/components/layout/Wordmark';
import { cn } from '@/lib/utils';

/**
 * The front-desk tablet. A student types their seat number and checks in.
 *
 * Writing attendance needs a staff session (the API returns 401 otherwise),
 * so the tablet is unlocked once by a librarian and left on this page. It
 * used to run without one: the public member list is redacted, so every
 * student was greeted as "Occupied", told they had "checked in successfully",
 * and nothing was saved.
 */
export default function KioskPage() {
  const { members } = useMembers();
  const { isPresent, markPresent, markAbsent, todayStr } = useAttendance();
  const { isAdmin, isLoading } = useAuth();
  const { addToast } = useToast();

  const [seatInput, setSeatInput] = useState('');
  const [activeSeat, setActiveSeat] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const activeMember = activeSeat !== null ? members.find((m) => m.seat === activeSeat) ?? null : null;

  // A kiosk left on someone's name is a privacy leak; return to the keypad.
  useEffect(() => {
    if (activeSeat === null) return;
    const t = setTimeout(() => setActiveSeat(null), 20_000);
    return () => clearTimeout(t);
  }, [activeSeat]);

  const press = (d: string) => setSeatInput((p) => (p.length < 2 ? p + d : p));

  const enter = () => {
    const n = parseInt(seatInput, 10);
    setSeatInput('');
    const m = members.find((x) => x.seat === n && !x.vacant);
    if (!m) {
      addToast('error', n >= 1 && n <= 95 ? `Seat ${n} has no member.` : 'Seats are numbered 1 to 95.');
      return;
    }
    setActiveSeat(n);
  };

  const act = async (dir: 'in' | 'out') => {
    if (!activeMember) return;
    setBusy(true);
    const ok = dir === 'in'
      ? await markPresent(todayStr, activeMember.seat)
      : await markAbsent(todayStr, activeMember.seat);
    setBusy(false);
    if (!ok) {
      addToast('error', 'That did not save. Please tell the librarian.');
      return;
    }
    addToast('success', dir === 'in' ? `Checked in at seat ${activeMember.seat}` : `Checked out of seat ${activeMember.seat}`);
    setActiveSeat(null);
  };

  const key = 'flex h-16 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] text-2xl font-medium tabular text-[var(--text-primary)] transition-ui hover:border-[var(--border-strong)] active:bg-[var(--bg-muted)]';

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg-void)]">
      <header className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 sm:px-6">
        <Wordmark size="md" caption="Self check-in" />
        {isAdmin && (
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Staff desk
          </Link>
        )}
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[360px]">
          {isLoading ? null : !isAdmin ? (
            <div className="text-center">
              <h1 className="font-display text-xl font-semibold leading-tight">Check-in is locked</h1>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                A librarian needs to sign in on this device once. After that it
                stays on this screen for students to use.
              </p>
              <Link
                href="/admin/login?next=/kiosk"
                className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--text-inverse)] transition-ui hover:bg-[var(--ink-hover)]"
              >
                Staff sign in
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          ) : activeMember ? (
            <div className="text-center">
              <p className="text-sm text-[var(--text-secondary)]">Seat</p>
              <p className="font-display text-4xl font-semibold leading-none tabular">{activeMember.seat}</p>
              <h1 className="mt-4 text-lg font-semibold">{activeMember.name}</h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {isPresent(todayStr, activeMember.seat) ? 'You are checked in today.' : 'Not checked in yet today.'}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={busy || isPresent(todayStr, activeMember.seat)}
                  onClick={() => act('in')}
                  className="flex min-h-[64px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-[var(--ink)] bg-[var(--ink)] text-sm font-semibold text-[var(--text-inverse)] transition-ui hover:bg-[var(--ink-hover)] disabled:cursor-not-allowed disabled:border-[var(--border-default)] disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-disabled)]"
                >
                  <LogIn className="size-5" aria-hidden="true" />
                  Check in
                </button>
                <button
                  type="button"
                  disabled={busy || !isPresent(todayStr, activeMember.seat)}
                  onClick={() => act('out')}
                  className="flex min-h-[64px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] transition-ui hover:bg-[var(--bg-muted)] disabled:cursor-not-allowed disabled:text-[var(--text-disabled)]"
                >
                  <LogOut className="size-5" aria-hidden="true" />
                  Check out
                </button>
              </div>
              <button
                type="button"
                onClick={() => setActiveSeat(null)}
                className="mt-4 cursor-pointer py-2 text-sm text-[var(--text-secondary)] underline-offset-4 hover:underline"
              >
                Not you? Go back
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-center font-display text-xl font-semibold leading-tight">Type your seat number</h1>
              <output
                aria-live="polite"
                className={cn(
                  'mt-6 flex h-20 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-surface)] font-display text-4xl font-semibold tabular',
                  !seatInput && 'text-[var(--text-disabled)]',
                )}
              >
                {seatInput || '—'}
              </output>
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button key={d} type="button" className={key} onClick={() => press(d)}>{d}</button>
                ))}
                <button type="button" className={cn(key, 'text-[var(--text-secondary)]')} onClick={() => setSeatInput((p) => p.slice(0, -1))} aria-label="Delete last digit">
                  <Delete className="size-6" aria-hidden="true" />
                </button>
                <button type="button" className={key} onClick={() => press('0')}>0</button>
                <button
                  type="button"
                  onClick={enter}
                  disabled={!seatInput}
                  aria-label="Confirm seat number"
                  className="flex h-16 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-[var(--ink)] bg-[var(--ink)] text-[var(--text-inverse)] transition-ui hover:bg-[var(--ink-hover)] disabled:cursor-not-allowed disabled:border-[var(--border-default)] disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-disabled)]"
                >
                  <ArrowRight className="size-6" />
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
