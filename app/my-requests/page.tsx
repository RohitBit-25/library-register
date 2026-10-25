'use client';

import { useState, useCallback } from 'react';
import { useSeatRequests } from '@/hooks/useSeatRequests';
import { useRouter } from 'next/navigation';
import { type SeatRequest } from '@/lib/types';
import { cn, fmtDate, durationLabel, shiftLabel, todayISO } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Search, Phone, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import UnifiedHeader from '@/components/layout/UnifiedHeader';

export default function MyRequestsPage() {
  const { lookupByPhone, storedUserPhone, requests: autoRequests } = useSeatRequests();
  const router = useRouter();

  const [phone, setPhone] = useState(storedUserPhone || '');
  const [results, setResults] = useState<SeatRequest[] | null>(
    autoRequests.length > 0 ? autoRequests : null
  );
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!storedUserPhone && autoRequests.length > 0);

  const handleSearch = useCallback(async () => {
    if (phone.length < 10) return;
    setLoading(true);
    const data = await lookupByPhone(phone);
    setResults(data);
    setSearched(true);
    setLoading(false);
  }, [phone, lookupByPhone]);

  // If user already has auto-loaded data and hasn't searched yet, use it
  const displayResults = results ?? (autoRequests.length > 0 ? autoRequests : null);

  const pendingCount = displayResults?.filter(r => r.status === 'pending').length ?? 0;
  const approvedCount = displayResults?.filter(r => r.status === 'approved').length ?? 0;
  const rejectedCount = displayResults?.filter(r => r.status === 'rejected').length ?? 0;

  const STATUS = {
    pending:    { label: 'Waiting for the desk', note: 'The librarian will check your payment and allot the seat.', text: 'text-[var(--indigo-600)]', Icon: Clock },
    waitlisted: { label: 'On the waitlist', note: 'The seat was taken first. You are next in line when one frees up.', text: 'text-[var(--marigold-700)]', Icon: Clock },
    approved:   { label: 'Seat allotted', note: 'Payment verified — the seat is yours from your joining date.', text: 'text-[var(--emerald-600)]', Icon: CheckCircle },
    rejected:   { label: 'Not approved', note: 'Please speak to the librarian at the desk.', text: 'text-[var(--ruby-600)]', Icon: XCircle },
  } as const;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg-void)]">
      <UnifiedHeader />

      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-6 sm:px-6 lg:py-10">
        <h1 className="font-display text-lg font-semibold leading-tight sm:text-xl">
          My requests
        </h1>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
          Enter the phone number you used when you asked for a seat.
        </p>

        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
        >
          <label htmlFor="my-requests-phone" className="sr-only">Phone number</label>
          <div className="relative flex-1">
            <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
            <input
              id="my-requests-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              className="min-h-[44px] w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-surface)] pl-9 pr-3 font-mono text-base text-[var(--text-primary)] tabular placeholder:font-body placeholder:text-[var(--text-tertiary)] focus:border-[var(--saffron-600)] focus:outline-none focus:ring-2 focus:ring-[var(--saffron-600)]/20"
            />
          </div>
          <Button type="submit" disabled={phone.length < 10 || loading} className="min-w-[96px]">
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
            Look up
          </Button>
        </form>

        <div className="mt-8" aria-live="polite">
          {searched && displayResults !== null && (
            displayResults.length === 0 ? (
              <div className="border-t border-[var(--border-default)] pt-6">
                <p className="font-semibold">No requests for this number</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Check the number, or{' '}
                  <button type="button" onClick={() => router.push('/browse')} className="cursor-pointer font-medium text-[var(--text-link)] underline underline-offset-4">
                    pick a free seat
                  </button>{' '}
                  to send one.
                </p>
              </div>
            ) : (
              <>
                <p className="mb-3 text-sm text-[var(--text-secondary)]">
                  <span className="font-mono tabular text-[var(--text-primary)]">{displayResults.length}</span>{' '}
                  {displayResults.length === 1 ? 'request' : 'requests'}
                  {pendingCount > 0 && <> · <span className="font-mono tabular">{pendingCount}</span> waiting</>}
                  {approvedCount > 0 && <> · <span className="font-mono tabular">{approvedCount}</span> allotted</>}
                  {rejectedCount > 0 && <> · <span className="font-mono tabular">{rejectedCount}</span> not approved</>}
                </p>
                <ul className="divide-y divide-[var(--border-default)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]">
                  {displayResults.map((req, i) => {
                    const st = STATUS[req.status as keyof typeof STATUS] ?? STATUS.pending;
                    return (
                      <li key={req.id || i} className="flex gap-4 p-4 sm:p-5">
                        <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-base)]">
                          <span className="text-xs leading-none text-[var(--text-tertiary)]">Seat</span>
                          <span className="mt-0.5 font-display text-md font-semibold leading-none tabular">{req.seat}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                            <p className={cn('flex items-center gap-1.5 text-sm font-semibold', st.text)}>
                              <st.Icon className="size-4" aria-hidden="true" />
                              {st.label}
                            </p>
                            <span className="font-mono text-xs text-[var(--text-tertiary)] tabular">
                              Sent {fmtDate(req.createdAt?.toString().split('T')[0] || '')}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-[var(--text-secondary)]">{st.note}</p>
                          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                            {/* The public lookup returns status fields only — no name,
                                UPI ref or note — so those rows appear only when present. */}
                            {req.userName && (
                              <>
                                <dt className="text-[var(--text-tertiary)]">Name</dt>
                                <dd className="text-[var(--text-primary)]">{req.userName}</dd>
                              </>
                            )}
                            <dt className="text-[var(--text-tertiary)]">Joining</dt>
                            <dd className="text-[var(--text-primary)]">
                              {fmtDate(req.joinDate || todayISO())} · {durationLabel(req.duration || '3M')} · {shiftLabel(req.shift || 'full')}
                            </dd>
                            {req.transactionId && (
                              <>
                                <dt className="text-[var(--text-tertiary)]">UPI ref</dt>
                                <dd className="font-mono text-[var(--text-primary)]">{req.transactionId}</dd>
                              </>
                            )}
                            {req.message && (
                              <>
                                <dt className="text-[var(--text-tertiary)]">Note</dt>
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
    </div>
  );
}
