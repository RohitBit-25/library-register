'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Shield, Clock, Activity, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';
import LoadError from '@/components/ui/LoadError';

interface AuditLogEntry {
  _id: string;
  action: string;
  details: string;
  seat?: number;
  user: string;
  timestamp: string;
}

/** Indian order and the library's clock: "26 Oct, 6:34 pm". It was the
 *  browser's default (US) format, "10/26/2026, 6:34:24 PM". */
const fmtLogTime = (t: string | Date) =>
  new Date(t).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

type LogKind = 'money' | 'seats' | 'attendance' | 'staff' | 'system';
const KINDS: { key: LogKind | 'all'; label: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'money', label: 'Money' },
  { key: 'seats', label: 'Seats & requests' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'staff', label: 'Staff & security' },
  { key: 'system', label: 'System' },
];
/** Which kind an action is. Order matters: renewals are money before seats. */
function kindOf(action = ''): LogKind {
  if (/fee|paid|renew/i.test(action)) return 'money';
  if (/present|absent|attendance/i.test(action)) return 'attendance';
  if (/signed|staff|pin|viewed id/i.test(action)) return 'staff';
  if (/automated|purged/i.test(action)) return 'system';
  return 'seats';
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState('');
  // Sign-ins are most of the rows and the least of the interest; "Everything"
  // leaves them out, "Staff & security" has them.
  const [kind, setKind] = useState<LogKind | 'all'>('all');

  /**
   * The log answers "what happened to seat 43?" and "what did Priya do
   * yesterday?" — but only if you can ask. It rendered up to a hundred rows
   * with no way to narrow them, so answering either question meant reading
   * the whole table.
   *
   * One box across all four fields rather than a row of selects: the terms an
   * admin has in mind are a seat number, a person, or a word like "renewed",
   * and which column that lands in is not something they should have to
   * decide first.
   */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ofKind = logs.filter((log) =>
      kind === 'all' ? log.action !== 'Signed In' : kindOf(log.action) === kind);
    if (!q) return ofKind;
    return ofKind.filter((log) =>
      log.action?.toLowerCase().includes(q)
      || log.details?.toLowerCase().includes(q)
      || log.user?.toLowerCase().includes(q)
      // Typing "43" should find seat 43 without matching every 43 in a date.
      || String(log.seat ?? '') === q
    );
  }, [logs, query, kind]);

  const fetchLogs = useCallback(() => {
    fetch('/api/audit')
      .then(res => { if (!res.ok) throw new Error(String(res.status)); return res.json(); })
      .then(data => { if (Array.isArray(data)) setLogs(data); })
      // A failed load used to read "No activity recorded yet".
      .catch(() => setLoadFailed(true))
      .finally(() => setIsLoading(false));
  }, []);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  const load = () => { setIsLoading(true); setLoadFailed(false); fetchLogs(); };

  return (
    <div className="space-y-[var(--space-6)] max-w-5xl mx-auto py-6">
      <PageHeader
        title="Activity log"
        icon={<Shield className="size-5" />}
        subtitle="Activity history and system logs for complete accountability."
      />

      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--text-tertiary)]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by seat, action or staff member…"
          aria-label="Search the activity log"
          className="min-h-[44px] w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] pl-10 pr-10 text-sm font-medium text-[var(--text-primary)] transition-ui placeholder:text-[var(--text-tertiary)] focus:border-[var(--saffron-500)] focus:outline-none focus:ring-2 focus:ring-[var(--saffron-500)] shadow-[var(--shadow-xs)]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-[var(--text-tertiary)] transition-ui hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Show">
        {KINDS.map((k) => (
          <button
            key={k.key}
            type="button"
            aria-pressed={kind === k.key}
            onClick={() => setKind(k.key)}
            className={cn(
              'min-h-[36px] cursor-pointer rounded-full border px-3.5 text-xs font-semibold transition-ui',
              kind === k.key
                ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--text-inverse)]'
                : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      {loadFailed && <LoadError what="the activity log" onRetry={load} className="mb-4" />}

      {query && (
        <p className="mb-3 text-xs font-medium text-[var(--text-secondary)]" aria-live="polite">
          {filtered.length} of {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
        </p>
      )}

      {/* Phones: one card per entry. The four-column table squeezed the
          details to a word per line and cut the time off at 390 px. */}
      {!isLoading && filtered.length > 0 && (
        <ul className="space-y-2 sm:hidden" aria-label="Activity log">
          {filtered.map((log) => (
            <li key={log._id} className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3.5 shadow-[var(--shadow-xs)]">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-[var(--text-primary)]">{log.action}</span>
                {log.seat ? <span className="shrink-0 font-mono text-xs text-[var(--text-tertiary)]">Seat {log.seat}</span> : null}
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{log.details}</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                <Clock className="size-3.5" aria-hidden="true" />
                {fmtLogTime(log.timestamp)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Card variant="base" className={cn('overflow-hidden', !isLoading && filtered.length > 0 && 'hidden sm:block', loadFailed && 'hidden')}>
        {/* Focusable so the scroll area can be scrolled from the keyboard. */}
        <div tabIndex={0} role="region" aria-label="Activity log table" className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar focus-visible:outline-2 focus-visible:outline-[var(--saffron-500)]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
              <tr>
                <th className="text-left p-4 font-bold text-[var(--text-secondary)]">Action</th>
                <th className="text-left p-4 font-bold text-[var(--text-secondary)]">Details</th>
                <th className="text-left p-4 font-bold text-[var(--text-secondary)]">Seat</th>
                <th className="text-left p-4 font-bold text-[var(--text-secondary)]">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[var(--text-tertiary)]">Loading logs...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center">
                    {/* "No activity recorded yet" is wrong when there is
                        plenty of activity and the search simply matched none
                        of it — the two states need different words and
                        different exits. */}
                    <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[var(--bg-muted)]">
                      {query
                        ? <Search className="size-7 text-[var(--text-tertiary)]" aria-hidden="true" />
                        : <Activity className="size-7 text-[var(--text-tertiary)]" aria-hidden="true" />}
                    </div>
                    {query ? (
                      <>
                        <p className="text-sm font-semibold text-[var(--text-secondary)]">
                          Nothing matches &ldquo;{query}&rdquo;
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                          Try a seat number, a staff member&rsquo;s name, or a word from the action.
                        </p>
                        <button
                          type="button"
                          onClick={() => setQuery('')}
                          className="mt-4 inline-flex min-h-[36px] cursor-pointer items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 text-xs font-bold text-[var(--text-secondary)] transition-ui hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)]"
                        >
                          Clear search
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-[var(--text-secondary)]">
                          No activity recorded yet
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                          Every allotment, renewal and vacate is logged here with the staff member who did it.
                        </p>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((log, i) => (
                  <motion.tr 
                    key={log._id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-[var(--bg-muted)] transition-colors"
                  >
                    <td className="p-4 font-medium text-[var(--text-primary)] whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="p-4 text-[var(--text-secondary)]">
                      {log.details}
                    </td>
                    <td className="p-4 font-mono text-[var(--text-tertiary)] whitespace-nowrap">
                      {log.seat ? `#${log.seat.toString().padStart(2, '0')}` : '-'}
                    </td>
                    <td className="p-4 text-[var(--text-tertiary)] whitespace-nowrap text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-4" aria-hidden="true" />
                        {fmtLogTime(log.timestamp)}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
