'use client';

import { useState, useCallback } from 'react';
import { useSeatRequests } from '@/hooks/useSeatRequests';
import { useRouter } from 'next/navigation';
import { type SeatRequest } from '@/lib/types';
import { cn, fmtDate, durationLabel, shiftLabel, todayISO } from '@/lib/utils';
import PixelButton from '@/components/pixel/PixelButton';
import { Search, Phone, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import { seatRow } from '@/lib/layoutConfig';
import PublicFooter from '@/components/layout/PublicFooter';
import { useLang } from '@/hooks/useLang';

/**
 * Where the request is, as three steps — so a student can see it moved, and
 * when, without calling the library to ask.
 */
function RequestTimeline({ req }: { req: SeatRequest }) {
  const { t } = useLang();
  const day = (d?: string | Date) => (d ? fmtDate(String(d).split('T')[0]) : '');
  const decided = req.status === 'approved' || req.status === 'rejected';
  const steps: { label: string; state: 'done' | 'now' | 'todo' | 'stop'; when?: string }[] = [
    { label: 'Request sent', state: 'done', when: day(req.createdAt) },
    req.status === 'rejected'
      ? { label: 'Not approved', state: 'stop', when: day(req.updatedAt) }
      : req.status === 'waitlisted'
        ? { label: 'On the waitlist', state: 'now' }
        : { label: 'Payment checked', state: req.status === 'approved' ? 'done' : 'now', when: req.status === 'approved' ? day(req.updatedAt) : undefined },
    { label: t('Desk {n} allotted', { n: req.seat }), state: req.status === 'approved' ? 'done' : 'todo', when: req.status === 'approved' ? day(req.updatedAt) : undefined },
  ];
  const shown = decided && req.status === 'rejected' ? steps.slice(0, 2) : steps;
  return (
    <ol className="mt-4 space-y-2" aria-label={t('Request progress')}>
      {shown.map((s) => (
        <li key={s.label} className="flex items-center gap-3 text-sm">
          <span
            aria-hidden="true"
            className={cn(
              'flex size-5 shrink-0 items-center justify-center border-2 text-xs font-bold',
              s.state === 'done' && 'border-[var(--emerald-600)] bg-[var(--emerald-50)] text-[var(--emerald-700)]',
              s.state === 'now' && 'border-[var(--saffron-600)] bg-[var(--saffron-50)] text-[var(--saffron-700)]',
              s.state === 'todo' && 'border-[var(--warm-ink-3)] text-transparent',
              s.state === 'stop' && 'border-[var(--ruby-600)] bg-[var(--ruby-50)] text-[var(--ruby-700)]',
            )}
          >
            {s.state === 'done' ? '✓' : s.state === 'stop' ? '✕' : s.state === 'now' ? '…' : ''}
          </span>
          <span className={cn('font-medium', s.state === 'todo' ? 'text-[var(--warm-ink-3)]' : 'text-[var(--warm-ink)]')}>
            {t(s.label)}
            <span className="sr-only">{s.state === 'done' ? ' — done' : s.state === 'now' ? ' — in progress' : s.state === 'stop' ? '' : ' — not yet'}</span>
          </span>
          {s.when && <span className="ml-auto font-mono text-xs text-[var(--warm-ink-3)] tabular">{s.when}</span>}
        </li>
      ))}
    </ol>
  );
}

export default function MyRequestsPage() {
  const { lookupByPhone, storedUserPhone, requests: autoRequests } = useSeatRequests();
  const router = useRouter();

  // null until the student types: until then the box shows the number they
  // used last time, which only appears after hydration.
  const [typed, setTyped] = useState<string | null>(null);
  const phone = typed ?? storedUserPhone;
  const [results, setResults] = useState<SeatRequest[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const { t } = useLang();

  const handleSearch = useCallback(async () => {
    if (phone.length < 10) return;
    setLoading(true);
    setLookupError(null);
    const res = await lookupByPhone(phone);
    if (res.ok) setResults(res.requests);
    else setLookupError(res.status === 429
      ? t('Too many look-ups from this connection. Please wait a few minutes and try again.')
      : t('We couldn’t check right now — this is a connection problem, not a missing request. Please try again.'));
    setLoading(false);
  }, [phone, lookupByPhone, t]);

  // If user already has auto-loaded data and hasn't searched yet, use it
  const displayResults = results ?? (autoRequests.length > 0 ? autoRequests : null);
  const searched = displayResults !== null;

  const pendingCount = displayResults?.filter(r => r.status === 'pending').length ?? 0;
  const approvedCount = displayResults?.filter(r => r.status === 'approved').length ?? 0;
  const rejectedCount = displayResults?.filter(r => r.status === 'rejected').length ?? 0;

  const STATUS = {
    pending:    { label: 'Waiting for the desk', note: 'The librarian will check your payment and allot the desk.', text: 'text-[var(--indigo-600)]', Icon: Clock },
    waitlisted: { label: 'On the waitlist', note: 'This desk went to someone else first. You are on the waitlist — the librarian will offer you the next free desk.', text: 'text-[var(--marigold-700)]', Icon: Clock },
    approved:   { label: 'Desk allotted', note: 'Payment verified — the desk is yours from your joining date.', text: 'text-[var(--emerald-600)]', Icon: CheckCircle },
    rejected:   { label: 'Not approved', note: 'Please speak to the librarian at the desk.', text: 'text-[var(--ruby-600)]', Icon: XCircle },
  } as const;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--warm-bg)] text-[var(--warm-ink)]">
      <UnifiedHeader />

      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-10 sm:px-6 lg:py-16">
        <h1 className="font-display text-[2.25rem] font-bold tracking-tight leading-none sm:text-[3rem]">
          {t('My requests')}
        </h1>
        <p className="mt-4 text-md text-[var(--warm-ink-2)]">
          {t('Enter the phone number you used when you asked for a seat.')}
        </p>

        <form
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
        >
          <label htmlFor="my-requests-phone" className="sr-only">{t('Phone number')}</label>
          <div className="px-box relative m-1 flex-1 bg-[var(--bg-surface)]">
            <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--warm-ink-3)]" aria-hidden="true" />
            <input
              id="my-requests-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={e => setTyped(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder={t('10-digit mobile number')}
              className="min-h-[52px] w-full bg-transparent pl-10 pr-3 font-mono text-lg tracking-wider text-[var(--warm-ink)] tabular placeholder:font-body placeholder:text-base placeholder:tracking-normal placeholder:text-[var(--text-tertiary)] focus:outline-none focus-visible:bg-[var(--warm-tint)]"
            />
          </div>
          <PixelButton type="submit" disabled={phone.length < 10 || loading}>
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
            {t('Look up')}
          </PixelButton>
        </form>

        <div className="mt-10" aria-live="polite">
          {lookupError ? (
            <div role="alert" className="px-box m-1 bg-[var(--bg-surface)] p-6">
              <p className="font-display text-xl font-bold">{t("Couldn't check your requests")}</p>
              <p className="mt-2 text-sm text-[var(--warm-ink-2)]">{lookupError}</p>
              <PixelButton type="button" onClick={handleSearch} className="mt-4">{t('Try again')}</PixelButton>
            </div>
          ) : searched && displayResults !== null && (
            displayResults.length === 0 ? (
              <div className="px-box m-1 bg-[var(--bg-surface)] p-6">
                <p className="font-display text-xl font-bold">{t('No requests for this number')}</p>
                <p className="mt-2 text-sm text-[var(--warm-ink-2)]">
                  {t('Check the number, or')}{' '}
                  <button type="button" onClick={() => router.push('/browse')} className="cursor-pointer font-semibold text-[var(--saffron-700)] underline underline-offset-4">
                    {t('pick a free seat')}
                  </button>{' '}
                  {t('to send one.')}
                </p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-[var(--warm-ink-2)]">
                  <span className="font-display tabular text-[var(--warm-ink)]">
                    {displayResults.length === 1 ? t('1 request') : t('{n} requests', { n: displayResults.length })}
                  </span>
                  {pendingCount > 0 && <> · {t('{n} waiting', { n: pendingCount })}</>}
                  {approvedCount > 0 && <> · {t('{n} allotted', { n: approvedCount })}</>}
                  {rejectedCount > 0 && <> · {t('{n} not approved', { n: rejectedCount })}</>}
                </p>
                <ul className="space-y-6">
                  {displayResults.map((req, i) => {
                    const st = STATUS[req.status as keyof typeof STATUS] ?? STATUS.pending;
                    return (
                      <li key={req.id || i} className="px-raised m-1 flex gap-4 bg-[var(--bg-surface)] p-4 sm:p-5">
                        <div className="flex size-16 shrink-0 flex-col items-center justify-center border-4 border-[var(--warm-ink)] bg-[var(--warm-band)]">
                          <span className="font-display text-xs uppercase leading-none text-[var(--warm-ink-3)]">Desk</span>
                          <span className="mt-1 font-display text-2xl font-bold leading-none tabular">{req.seat}</span>
                          <span className="sr-only">{seatRow(req.seat)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                            <p className={cn('flex items-center gap-1.5 text-sm font-semibold', st.text)}>
                              <st.Icon className="size-4" aria-hidden="true" />
                              {t(st.label)}
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-[var(--text-secondary)]">{t(st.note)}</p>
                          <RequestTimeline req={req} />
                          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                            {/* The public lookup returns status fields only — no name,
                                UPI ref or note — so those rows appear only when present. */}
                            {req.userName && (
                              <>
                                <dt className="text-[var(--text-tertiary)]">{t('Name')}</dt>
                                <dd className="text-[var(--text-primary)]">{req.userName}</dd>
                              </>
                            )}
                            <dt className="text-[var(--text-tertiary)]">{t('Joining')}</dt>
                            <dd className="text-[var(--text-primary)]">
                              {fmtDate(req.joinDate || todayISO())} · {t(durationLabel(req.duration || '3M'))} · {t(shiftLabel(req.shift || 'full'))}
                            </dd>
                            {req.transactionId && (
                              <>
                                <dt className="text-[var(--text-tertiary)]">{t('UPI ref')}</dt>
                                <dd className="font-mono text-[var(--text-primary)]">{req.transactionId}</dd>
                              </>
                            )}
                            {req.message && (
                              <>
                                <dt className="text-[var(--text-tertiary)]">{t('Note')}</dt>
                                <dd className="text-[var(--text-primary)]">{req.message}</dd>
                              </>
                            )}
                          </dl>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
