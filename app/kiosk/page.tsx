'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMembers } from '@/hooks/useMembers';
import { useAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useLang } from '@/hooks/useLang';
import { Delete, ArrowRight, ArrowLeft, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import BrandLockup from '@/components/brand/BrandLockup';
import PixelButton from '@/components/pixel/PixelButton';
import { isSeat } from '@/lib/layoutConfig';
import { cn, daysUntilExpiry } from '@/lib/utils';

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
  const { members, loadFailed } = useMembers();
  const { isPresent, markPresent, markAbsent, todayStr } = useAttendance();
  const { isAdmin, isLoading } = useAuth();
  const { addToast } = useToast();
  const { lang, setLang, t } = useLang();

  const [seatInput, setSeatInput] = useState('');
  const [activeSeat, setActiveSeat] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  /** The "done" screen after a check-in/out: big, readable from a step away,
   *  and gone on its own so the next student finds the keypad. */
  const [done, setDone] = useState<{ dir: 'in' | 'out'; seat: number; name: string; at: string } | null>(null);

  const activeMember = activeSeat !== null ? members.find((m) => m.seat === activeSeat) ?? null : null;

  // A kiosk left on someone's name is a privacy leak; return to the keypad.
  useEffect(() => {
    if (activeSeat === null) return;
    const t = setTimeout(() => setActiveSeat(null), 20_000);
    return () => clearTimeout(t);
  }, [activeSeat]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(null), 4000);
    return () => clearTimeout(t);
  }, [done]);

  const press = (d: string) => setSeatInput((p) => (p.length < 2 ? p + d : p));

  const enter = () => {
    // Without the member list every seat looked empty ("Seat 12 has no member").
    if (loadFailed) {
      setSeatInput('');
      addToast('error', t('Check-in can\'t reach the server right now. Please tell the librarian.'));
      return;
    }
    const n = parseInt(seatInput, 10);
    setSeatInput('');
    const m = members.find((x) => x.seat === n && !x.vacant);
    if (!m) {
      addToast('error', isSeat(n) ? t('Desk {n} has no member — please check the number.', { n }) : t('There is no desk {n}.', { n }));
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
      addToast('error', t('That did not save. Please tell the librarian.'));
      return;
    }
    setDone({
      dir,
      seat: activeMember.seat,
      name: activeMember.name.split(' ')[0],
      at: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' }),
    });
    setActiveSeat(null);
  };

  const key = 'px-btn px-raised m-1 flex h-16 cursor-pointer items-center justify-center bg-[var(--bg-surface)] font-display text-[1.75rem] font-semibold tabular text-[var(--warm-ink)] hover:bg-[var(--warm-band)]';

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--warm-bg)] text-[var(--warm-ink)]">
      <header className="flex items-center justify-between gap-3 border-b-4 border-[var(--warm-ink)] px-4 py-3 sm:px-6">
        <span className="flex min-w-0 items-center gap-3">
          <BrandLockup priority />
          <span className="hidden border-l-2 border-[var(--warm-band)] pl-3 text-sm font-semibold text-[var(--warm-ink-3)] sm:block">{t('Self check-in')}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
        {/* Same toggle as the student header: named in the language it switches to. */}
        <button
          type="button"
          onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          aria-label={lang === 'hi' ? 'Switch to English' : 'हिंदी में देखें'}
          lang={lang === 'hi' ? 'en' : 'hi'}
          className="px-box m-1 min-h-[44px] cursor-pointer px-3 text-sm font-semibold text-[var(--warm-ink)] hover:bg-[var(--warm-band)]"
        >
          {lang === 'hi' ? 'English' : 'हिंदी'}
        </button>
        {isAdmin && (
          <Link href="/" aria-label="Staff desk" className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 text-sm font-medium text-[var(--warm-ink-3)] hover:text-[var(--warm-ink)]">
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Staff desk</span>
          </Link>
        )}
        </span>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[380px]">
          {isLoading ? null : !isAdmin ? (
            <div className="text-center">
              <h1 className="font-display text-[2rem] font-bold tracking-tight leading-none">Check-in is locked</h1>
              <p className="mt-4 text-sm leading-relaxed text-[var(--warm-ink-2)]">
                A librarian needs to sign in on this device once. After that it
                stays on this screen for students to use.
              </p>
              <PixelButton href="/admin/login?next=/kiosk" className="mt-7">
                Staff sign in ▶
              </PixelButton>
            </div>
          ) : done ? (
            <div className="text-center" role="status" aria-live="polite">
              <div className="px-box mx-auto flex size-24 items-center justify-center bg-[var(--emerald-50)]">
                <CheckCircle2 className="size-12 text-[var(--emerald-600)]" aria-hidden="true" />
              </div>
              <h1 className="mt-6 font-display text-[2rem] font-bold leading-tight tracking-tight">
                {t(done.dir === 'in' ? 'Welcome, {name}!' : 'Bye, {name}!', { name: done.name })}
              </h1>
              <p className="mt-2 text-md text-[var(--warm-ink-2)]">
                {t(done.dir === 'in' ? 'Checked in at desk {n} · {t}' : 'Checked out of desk {n} · {t}', { n: done.seat, t: done.at })}
              </p>
              <button
                type="button"
                onClick={() => setDone(null)}
                className="mt-6 cursor-pointer py-2 text-sm text-[var(--warm-ink-2)] underline-offset-4 hover:underline"
              >
                {t('Next student')}
              </button>
            </div>
          ) : activeMember ? (
            <div className="text-center">
              <p className="px-box m-1 inline-flex items-baseline gap-3 bg-[var(--px-hud)] px-5 py-3 font-display text-[var(--px-hud-text)]">
                <span className="text-base">{t('Desk')}</span>
                <span className="text-[3rem] font-bold tracking-tight leading-none tabular">{activeMember.seat}</span>
              </p>
              <h1 className="mt-6 font-display text-2xl font-bold">{activeMember.name}</h1>
              <p className="mt-1 text-sm text-[var(--warm-ink-2)]">
                {t(isPresent(todayStr, activeMember.seat) ? 'You are checked in today.' : 'Not checked in yet today.')}
              </p>
              {/* A plan that has run out: say so here, where the student is,
                  rather than leaving it for the librarian to chase. */}
              {activeMember.expiry && daysUntilExpiry(activeMember.expiry) < 0 && (
                <p role="alert" className="px-box m-1 mt-4 bg-[var(--ruby-50)] px-4 py-3 text-sm font-semibold text-[var(--ruby-700)]">
                  {(() => { const n = Math.abs(daysUntilExpiry(activeMember.expiry)); return n === 1 ? t('Your plan ended 1 day ago — please renew at the desk.') : t('Your plan ended {n} days ago — please renew at the desk.', { n }); })()}
                </p>
              )}
              {activeMember.expiry && daysUntilExpiry(activeMember.expiry) >= 0 && daysUntilExpiry(activeMember.expiry) <= 3 && (
                <p className="px-box m-1 mt-4 bg-[var(--marigold-50)] px-4 py-3 text-sm font-semibold text-[var(--marigold-800)]">
                  {(() => { const n = daysUntilExpiry(activeMember.expiry); return n === 0 ? t('Your plan ends today — renew at the desk to keep it.') : n === 1 ? t('Your plan ends in 1 day — renew at the desk to keep it.') : t('Your plan ends in {n} days — renew at the desk to keep it.', { n }); })()}
                </p>
              )}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled={busy || isPresent(todayStr, activeMember.seat)}
                  onClick={() => act('in')}
                  className="px-btn px-raised m-1 flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1 bg-[var(--saffron-600)] font-display text-base font-semibold text-[var(--text-inverse)] hover:bg-[var(--saffron-700)] disabled:cursor-not-allowed disabled:bg-[var(--warm-band)] disabled:text-[var(--warm-ink-3)]"
                >
                  <LogIn className="size-5" aria-hidden="true" />
                  {t('Check in')}
                </button>
                <button
                  type="button"
                  disabled={busy || !isPresent(todayStr, activeMember.seat)}
                  onClick={() => act('out')}
                  className="px-btn px-raised m-1 flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1 bg-[var(--bg-surface)] font-display text-base font-semibold text-[var(--warm-ink)] hover:bg-[var(--warm-band)] disabled:cursor-not-allowed disabled:bg-[var(--warm-band)] disabled:text-[var(--warm-ink-3)]"
                >
                  <LogOut className="size-5" aria-hidden="true" />
                  {t('Check out')}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setActiveSeat(null)}
                className="mt-5 cursor-pointer py-2 text-sm text-[var(--warm-ink-2)] underline-offset-4 hover:underline"
              >
                {t('Not you? Go back')}
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-center font-display text-[2rem] font-bold tracking-tight leading-none">{t('Type your desk number')}</h1>
              <output
                aria-live="polite"
                className={cn(
                  'px-box m-1 mt-7 flex h-24 items-center justify-center bg-[var(--px-hud)] font-display text-[3.5rem] font-bold tracking-tight tabular text-[var(--px-hud-text)]',
                  !seatInput && 'text-[var(--px-hud-text)]/40',
                )}
              >
                {seatInput || '—'}
              </output>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button key={d} type="button" className={key} onClick={() => press(d)}>{d}</button>
                ))}
                <button type="button" className={cn(key, 'text-[var(--warm-ink-2)]')} onClick={() => setSeatInput((p) => p.slice(0, -1))} aria-label="Delete last digit">
                  <Delete className="size-6" aria-hidden="true" />
                </button>
                <button type="button" className={key} onClick={() => press('0')}>0</button>
                <button
                  type="button"
                  onClick={enter}
                  disabled={!seatInput}
                  aria-label="Confirm seat number"
                  className="px-btn px-raised m-1 flex h-16 cursor-pointer items-center justify-center bg-[var(--saffron-600)] text-[var(--text-inverse)] hover:bg-[var(--saffron-700)] disabled:cursor-not-allowed disabled:bg-[var(--warm-band)] disabled:text-[var(--warm-ink-3)]"
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
