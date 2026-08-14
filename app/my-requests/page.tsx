'use client';

import { useState, useCallback } from 'react';
import { useSeatRequests } from '@/hooks/useSeatRequests';
import { useRouter } from 'next/navigation';
import { type SeatRequest } from '@/lib/types';
import { cn, fmtDate, durationLabel, shiftLabel, todayISO } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Search,
  Phone,
  Inbox,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Armchair,
  Receipt,
  MessageSquare,
  CalendarDays,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-void)]">
      <UnifiedHeader />

      <main className="animate-fade-in mx-auto w-full max-w-[900px] flex-1 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">
            <Inbox className="h-5 w-5 text-[var(--text-tertiary)]" aria-hidden="true" />
            My requests
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Track the status of your seat requests
          </p>
        </div>
        <button
          onClick={() => router.push('/browse')}
          className="cursor-pointer flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border-default)]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Browse</span>
        </button>
      </div>

      {/* Phone Search Card */}
      <Card variant="base" className="p-5 mb-6">
        <label className="text-xs font-bold text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5" />
          Enter your registered phone number
        </label>
        <div className="flex gap-2">
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="10-digit mobile number"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--sapphire-500)]/40 transition-ui font-mono tracking-wider"
          />
          <button
            onClick={handleSearch}
            disabled={phone.length < 10 || loading}
            className={cn(
              'cursor-pointer px-5 py-2.5 rounded-xl text-sm font-bold transition-ui flex items-center gap-2',
              phone.length >= 10 && !loading
                ? 'bg-[var(--saffron-700)] text-[var(--text-inverse)] hover:bg-[var(--saffron-800)] active:scale-[0.98]'
                : 'bg-[var(--bg-muted)] text-[var(--text-tertiary)] cursor-not-allowed'
            )}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </Card>

      {/* Results */}
      <AnimatePresence mode="wait">
        {searched && displayResults !== null && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Summary chips */}
            {displayResults.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold bg-[var(--saffron-50)] text-[var(--saffron-600)] border-[var(--saffron-200)]">
                  <Clock className="w-3 h-3" />
                  {pendingCount} Pending
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold bg-[var(--emerald-50)] text-[var(--emerald-600)] border-[var(--emerald-200)]">
                  <CheckCircle className="w-3 h-3" />
                  {approvedCount} Approved
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold bg-[var(--ruby-50)] text-[var(--ruby-600)] border-[var(--ruby-200)]">
                  <XCircle className="w-3 h-3" />
                  {rejectedCount} Rejected
                </span>
              </div>
            )}

            {/* Request Cards */}
            <div className="space-y-3 pb-20">
              {displayResults.length === 0 ? (
                <Card variant="base" className="p-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg-overlay)] flex items-center justify-center mx-auto mb-3">
                    <Inbox className="w-7 h-7 text-[var(--text-tertiary)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    No requests found
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    No seat requests found for this phone number.
                    <br />
                    Browse available seats to submit a request.
                  </p>
                </Card>
              ) : (
                displayResults.map((req, i) => (
                  <motion.div
                    key={req.id || i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      variant="base"
                      className={cn(
                        'overflow-hidden shadow-sm',
                        req.status === 'pending' && 'border-l border-l-[var(--saffron-500)]',
                        req.status === 'approved' && 'border-l border-l-[var(--emerald-500)]',
                        req.status === 'rejected' && 'border-l border-l-[var(--ruby-500)]',
                      )}
                    >
                      <div className="p-4">
                        {/* Top row */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-mono font-black',
                                req.status === 'pending' && 'bg-[var(--saffron-50)] text-[var(--saffron-600)]',
                                req.status === 'approved' && 'bg-[var(--emerald-50)] text-[var(--emerald-600)]',
                                req.status === 'rejected' && 'bg-[var(--ruby-50)] text-[var(--ruby-600)]',
                              )}
                            >
                              {String(req.seat).padStart(2, '0')}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[var(--text-primary)]">
                                  Seat #{req.seat}
                                </span>
                                <Badge variant={req.status === 'approved' ? 'active' : (req.status === 'rejected' ? 'expired' : 'pending')} />
                              </div>
                              <span className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1 mt-0.5">
                                <Armchair className="w-3 h-3" />
                                Requested by {req.userName}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-[var(--text-tertiary)] whitespace-nowrap">
                            {fmtDate(req.createdAt?.toString().split('T')[0] || '')}
                          </span>
                        </div>

                        {/* Transaction ID */}
                        <div className="px-3 py-2 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-subtle)] mb-2">
                          <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
                            <CalendarDays className="w-3 h-3 text-[var(--text-tertiary)]" />
                            Joining {fmtDate(req.joinDate || todayISO())}
                            <Clock className="w-3 h-3 text-[var(--text-tertiary)] ml-2" />
                            {durationLabel(req.duration || '3M')} · {shiftLabel(req.shift || 'full')}
                          </span>
                        </div>

                        {req.transactionId && (
                          <div className="px-3 py-2 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-subtle)] mb-2">
                            <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
                              <Receipt className="w-3 h-3 text-[var(--text-tertiary)]" />
                              UPI Ref: <span className="font-mono">{req.transactionId}</span>
                            </span>
                          </div>
                        )}

                        {/* Message */}
                        {req.message && (
                          <div className="px-3 py-2 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-subtle)]">
                            <span className="text-[11px] text-[var(--text-secondary)] flex items-start gap-1.5">
                              <MessageSquare className="w-3 h-3 mt-0.5 shrink-0 text-[var(--text-tertiary)]" />
                              {req.message}
                            </span>
                          </div>
                        )}

                        {/* Status Message */}
                        <div className="mt-3 text-xs">
                          {req.status === 'pending' && (
                            <p className="text-[var(--saffron-600)] font-medium flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              Awaiting admin verification of your payment
                            </p>
                          )}
                          {req.status === 'approved' && (
                            <p className="text-[var(--emerald-600)] font-medium flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Payment verified! Your seat has been allotted.
                            </p>
                          )}
                          {req.status === 'rejected' && (
                            <p className="text-[var(--ruby-600)] font-medium flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5" />
                              Request was not approved. Please contact the library.
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Initial state — not yet searched */}
        {!searched && (
          <motion.div
            key="initial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card variant="base" className="p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-muted)]">
                <Search className="h-8 w-8 text-[var(--text-tertiary)]" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
                Find your requests
              </h3>
              <p className="text-sm text-[var(--text-tertiary)] leading-relaxed max-w-xs mx-auto">
                Enter the phone number you used when submitting your seat request to view its current status.
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}
