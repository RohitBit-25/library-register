'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Shield, Clock, Activity, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/layout/PageHeader';

interface AuditLogEntry {
  _id: string;
  action: string;
  details: string;
  seat?: number;
  user: string;
  timestamp: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');

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
    if (!q) return logs;
    return logs.filter((log) =>
      log.action?.toLowerCase().includes(q)
      || log.details?.toLowerCase().includes(q)
      || log.user?.toLowerCase().includes(q)
      // Typing "43" should find seat 43 without matching every 43 in a date.
      || String(log.seat ?? '') === q
    );
  }, [logs, query]);

  useEffect(() => {
    fetch('/api/audit')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLogs(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-[var(--space-6)] max-w-5xl mx-auto py-6">
      <PageHeader
        title="Activity Log"
        icon={<Shield className="h-5 w-5" />}
        subtitle="Activity history and system logs for complete accountability."
      />

      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by seat, action or staff member…"
          aria-label="Search the activity log"
          className="min-h-[44px] w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] pl-10 pr-10 text-sm font-medium text-[var(--text-primary)] transition-ui placeholder:text-[var(--text-tertiary)] focus:border-[var(--saffron-500)] focus:outline-none focus:ring-2 focus:ring-[var(--saffron-500)]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-[var(--text-tertiary)] transition-ui hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {query && (
        <p className="mb-3 text-xs font-medium text-[var(--text-secondary)]" aria-live="polite">
          {filtered.length} of {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
        </p>
      )}

      <Card variant="base" className="overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 backdrop-blur-xl bg-[var(--bg-surface)]/90 border-b border-[var(--border-default)]">
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
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-muted)]">
                      {query
                        ? <Search className="h-7 w-7 text-[var(--text-tertiary)]" aria-hidden="true" />
                        : <Activity className="h-7 w-7 text-[var(--text-tertiary)]" aria-hidden="true" />}
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
                        <Clock className="w-4 h-4" />
                        {new Date(log.timestamp).toLocaleString()}
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
