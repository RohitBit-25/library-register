'use client';

import { useState, useMemo } from 'react';
import { useSeatRequests } from '@/hooks/useSeatRequests';
import { useToast } from '@/hooks/useToast';
import { fmtDate, cn, todayISO, durationLabel, shiftLabel } from '@/lib/utils';
import { type SeatRequest } from '@/lib/types';
import { formatINR, planPrice } from '@/lib/pricing';
import {
  Inbox,
  Check,
  X,
  Clock,
  CalendarDays,
  CheckCircle,
  XCircle,
  Phone,
  MessageSquare,
  MessageCircle,
  Armchair,
  Filter,
  Trash2,
  Smartphone,
  Banknote,
  FileText,
  ExternalLink,
  Hourglass,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';

type FilterTab = 'pending' | 'waitlisted' | 'approved' | 'rejected' | 'all';

/**
 * A request's uploaded ID, fetched only when staff ask for it.
 *
 * Opened through a blob: URL — Chrome refuses to open a data: URL in a new
 * tab, so the old "View Document" link did nothing for PDFs.
 */
function RequestDocument({ id }: { id: string }) {
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'error'; error?: string } | { status: 'ready'; dataUrl: string; blobUrl: string }>({ status: 'idle' });

  const load = async () => {
    setState({ status: 'loading' });
    try {
      const res = await fetch(`/api/requests/${encodeURIComponent(id)}/document`, { credentials: 'same-origin' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.documentUrl) throw new Error(body.error || 'Could not load the ID.');
      const blob = await (await fetch(body.documentUrl)).blob();
      const blobUrl = URL.createObjectURL(blob);
      setState({ status: 'ready', dataUrl: body.documentUrl, blobUrl });
    } catch (err) {
      setState({ status: 'error', error: (err as Error).message });
    }
  };

  return (
    <div className="mb-3 px-3 py-2 rounded-[var(--radius-lg)] bg-[var(--sapphire-50)] border border-[var(--sapphire-200)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-[var(--sapphire-600)] flex items-center gap-1.5">
          <FileText className="size-4" /> ID document submitted
        </span>
        {state.status === 'ready' ? (
          <a href={state.blobUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[var(--text-link)] underline flex items-center gap-1">
            <ExternalLink className="size-4" aria-hidden="true" /> Open full size
          </a>
        ) : (
          <button type="button" onClick={load} disabled={state.status === 'loading'} className="cursor-pointer text-xs font-semibold text-[var(--text-link)] underline disabled:cursor-wait disabled:opacity-60">
            {state.status === 'loading' ? 'Loading…' : 'View ID'}
          </button>
        )}
      </div>
      {state.status === 'error' && <p className="mt-1.5 text-xs text-[var(--ruby-700)]">{state.error}</p>}
      {state.status === 'ready' && state.dataUrl.startsWith('data:image') && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={state.dataUrl} alt="Uploaded ID document" className="mt-2 w-full max-h-48 object-contain rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]" />
      )}
    </div>
  );
}

export default function RequestsPage() {
  const { requests, approveRequest, rejectRequest, reopenRequest, deleteRequest } = useSeatRequests();
  const { addToast } = useToast();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>('pending');

  const filtered = useMemo(() => {
    if (filter === 'all') return requests;
    return requests.filter(r => r.status === filter);
  }, [requests, filter]);

  /** Pending requests per desk — more than one means staff must choose. */
  const wanted = useMemo(() => {
    const c = new Map<number, number>();
    for (const r of requests) if (r.status === 'pending') c.set(r.seat, (c.get(r.seat) ?? 0) + 1);
    return c;
  }, [requests]);

  const counts = useMemo(() => {
    let pending = 0, waitlisted = 0, approved = 0, rejected = 0;
    for (const r of requests) {
      if (r.status === 'pending') pending++;
      else if (r.status === 'waitlisted') waitlisted++;
      else if (r.status === 'approved') approved++;
      else rejected++;
    }
    return { pending, waitlisted, approved, rejected, all: requests.length };
  }, [requests]);

  // Approval and allotment happen together on the server (PATCH /api/requests),
  // so they cannot diverge. If the seat was taken in the meantime the request
  // stays pending and we send the admin to the seat map to sort it out.
  const handleApprove = async (req: SeatRequest) => {
    const result = await approveRequest(req.id);

    if (result.ok) {
      const moved = result.movedToWaitlist ?? 0;
      addToast('success', `Seat #${req.seat} allotted to ${req.userName}`
        + (moved ? `. ${moved} other request${moved === 1 ? '' : 's'} for it moved to the waitlist.` : ''));
      return;
    }

    addToast('error', result.error ?? 'Could not approve this request.');
    if (result.status === 409) {
      const query = new URLSearchParams({
        seat: String(req.seat),
        name: req.userName,
        phone: req.userPhone,
        paymentMode: req.paymentMode || 'upi',
      });
      router.push(`/?${query.toString()}`);
    }
  };

  const handleReject = async (id: string | number, seat: number) => {
    const result = await rejectRequest(id);
    if (!result.ok) return addToast('error', result.error ?? 'Could not reject this request.');
    // One click, so one click back.
    addToast('warning', `Request for Seat #${seat} rejected`, {
      label: 'Undo',
      onClick: async () => {
        const undo = await reopenRequest(id);
        addToast(undo.ok ? 'success' : 'error', undo.ok ? `Request for Seat #${seat} is pending again` : (undo.error ?? 'Could not undo.'));
      },
    });
  };

  const handleDelete = async (id: string | number) => {
    const result = await deleteRequest(id);
    if (result.ok) addToast('warning', 'Request deleted');
    else addToast('error', result.error ?? 'Could not delete this request.');
  };

  const tabs: { key: FilterTab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'pending', label: 'Pending', icon: <Clock className="size-4" />, count: counts.pending },
    { key: 'waitlisted', label: 'Waitlist', icon: <Hourglass className="size-4" />, count: counts.waitlisted },
    { key: 'approved', label: 'Approved', icon: <CheckCircle className="size-4" />, count: counts.approved },
    { key: 'rejected', label: 'Rejected', icon: <XCircle className="size-4" />, count: counts.rejected },
    { key: 'all', label: 'All', icon: <Filter className="size-4" />, count: counts.all },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Requests"
        icon={<Inbox className="size-5" />}
        subtitle="Review and verify payments for seat requests."
        badge={counts.pending > 0 ? (
          <span className="rounded-[var(--radius-xs)] border border-[var(--indigo-400)] bg-[var(--indigo-50)] px-1.5 py-0.5 font-body text-xs font-semibold text-[var(--indigo-600)]">
            {counts.pending} new
          </span>
        ) : undefined}
      />

      {/* Filter Tabs */}
      <div className="mb-5 flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-[var(--radius-md)] bg-[var(--bg-muted)] p-0.5">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'flex min-h-[36px] items-center gap-1.5 px-3 rounded-[var(--radius-sm)] text-sm font-medium transition-ui cursor-pointer whitespace-nowrap',
              filter === tab.key
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)] ring-1 ring-[var(--border-default)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span
                className={cn(
                  'font-mono text-xs tabular',
                  filter === tab.key
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-tertiary)]'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-[var(--space-3)] pb-20">
        {filtered.length === 0 ? (
          <Card variant="base" className="p-10 text-center">
            <div className="size-14 rounded-[var(--radius-2xl)] bg-[var(--bg-overlay)] flex items-center justify-center mx-auto mb-3">
              <Inbox className="size-7 text-[var(--text-tertiary)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              {filter === 'pending'
                ? 'No pending requests'
                : filter === 'approved'
                  ? 'No approved requests'
                  : filter === 'rejected'
                    ? 'No rejected requests'
                    : 'No requests yet'}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              When users request seats, they&apos;ll appear here
            </p>
          </Card>
        ) : (
          filtered.map(req => (
            <Card
              key={req.id}
              variant="base"
              className={cn(
                'overflow-hidden',
              )}
            >
              <div className="p-4">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'size-10 rounded-[var(--radius-xl)] flex items-center justify-center text-sm font-mono font-semibold',
                        req.status === 'pending' && 'bg-[var(--sapphire-50)] text-[var(--sapphire-600)]',
                        req.status === 'approved' && 'bg-[var(--emerald-50)] text-[var(--emerald-600)]',
                        req.status === 'rejected' && 'bg-[var(--ruby-50)] text-[var(--ruby-600)]',
                      )}
                    >
                      {req.seat}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[var(--text-primary)]">
                          {req.userName}
                        </span>
                        <Badge variant={req.status === 'approved' ? 'active' : (req.status === 'rejected' ? 'expired' : 'pending')} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                          <Armchair className="size-4" />
                          Seat #{req.seat}
                        </span>
                        {req.status === 'pending' && (wanted.get(req.seat) ?? 0) > 1 && (
                          // Approving one moves the others to the waitlist.
                          <span className="rounded-md bg-[var(--marigold-50)] px-1.5 py-0.5 text-xs font-bold text-[var(--marigold-800)]">
                            {wanted.get(req.seat)} students want this desk
                          </span>
                        )}
                        <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                          <Phone className="size-4" />
                          {req.userPhone}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                          <CalendarDays className="size-4" />
                          {fmtDate(req.joinDate || todayISO())}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1 capitalize">
                          <Clock className="size-4" />
                          {durationLabel(req.duration || '3M')} · {shiftLabel(req.shift || 'full')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-xs font-mono text-[var(--text-tertiary)] whitespace-nowrap">
                      {fmtDate(req.createdAt.toString().split('T')[0])}
                    </span>
                    {/* Reach the student without copying the number anywhere. */}
                    <div className="flex gap-1.5">
                      <a href={`tel:${req.userPhone}`} aria-label={`Call ${req.userName}`} className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-default)] text-[var(--text-secondary)] transition-ui hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]">
                        <Phone className="size-4" aria-hidden="true" />
                      </a>
                      <a href={`https://wa.me/91${req.userPhone}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${req.userName}`} className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--emerald-200)] bg-[var(--emerald-50)] text-[var(--emerald-700)] transition-ui hover:bg-[var(--emerald-100)]">
                        <MessageCircle className="size-4" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="mb-3 px-3 py-2 rounded-[var(--radius-lg)] bg-[var(--bg-muted)] border border-[var(--border-subtle)] flex items-center gap-2">
                  {req.paymentMode === 'cash' ? (
                    <>
                      <div className="size-7 rounded-lg bg-[var(--emerald-50)] flex items-center justify-center flex-shrink-0">
                        <Banknote className="size-4 text-[var(--emerald-600)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-[var(--emerald-600)] block">Cash Payment</span>
                        <span className="text-xs text-[var(--text-tertiary)]">Verify cash received at counter</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="size-7 rounded-lg bg-[var(--saffron-50)] flex items-center justify-center flex-shrink-0">
                        <Smartphone className="size-4 text-[var(--saffron-600)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-[var(--emerald-600)] block">UPI Payment</span>
                        {/* What the student says they paid — check it against the UPI ref. */}
                        <span className="block text-xs text-[var(--text-secondary)]">
                          Paid <span className="font-semibold tabular text-[var(--text-primary)]">{formatINR(req.amount || planPrice(req.duration))}</span>
                          {req.amount && req.amount !== planPrice(req.duration)
                            ? <> · plan is {formatINR(planPrice(req.duration))}</>
                            : !req.amount && <> (plan price)</>}
                        </span>
                        {req.transactionId && (
                          <span className="text-xs font-mono text-[var(--text-secondary)] break-all">Ref: {req.transactionId}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* ID document: loaded on demand, not with the list */}
                {req.hasDocument && <RequestDocument id={String(req.id)} />}

                {/* Message */}
                {req.message && (
                  <div className="mb-3 px-3 py-2 rounded-[var(--radius-lg)] bg-[var(--bg-muted)] border border-[var(--border-subtle)]">
                    <span className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
                      <MessageSquare className="size-4 mt-0.5 shrink-0 text-[var(--text-tertiary)]" />
                      {req.message}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {req.status === 'pending' && (
                    <>
                      <Button
                        variant="primary"
                        className="flex-1 text-xs h-[36px]"
                        onClick={() => handleApprove(req)}
                      >
                        <Check className="size-4 mr-1" /> Approve and allot
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-[36px] flex-1 border border-[var(--ruby-200)] bg-[var(--ruby-50)] text-xs text-[var(--ruby-600)] hover:bg-[var(--ruby-100)]"
                        onClick={() => handleReject(req.id, req.seat)}
                      >
                        <X className="size-4 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  {req.status !== 'pending' && (
                    <Button
                      variant="ghost"
                      className="px-3 py-2 h-auto text-xs text-[var(--text-tertiary)] hover:text-[var(--ruby-600)] hover:bg-[var(--ruby-50)] ml-auto"
                      onClick={() => handleDelete(req.id)}
                    >
                      <Trash2 className="size-4 mr-1" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
