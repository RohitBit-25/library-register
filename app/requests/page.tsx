'use client';

import { useState, useMemo } from 'react';
import { useSeatRequests } from '@/hooks/useSeatRequests';
import { useToast } from '@/hooks/useToast';
import { fmtDate, cn, todayISO, durationLabel, shiftLabel } from '@/lib/utils';
import { type SeatRequest } from '@/lib/types';
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

export default function RequestsPage() {
  const { requests, approveRequest, rejectRequest, deleteRequest } = useSeatRequests();
  const { addToast } = useToast();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>('pending');

  const filtered = useMemo(() => {
    if (filter === 'all') return requests;
    return requests.filter(r => r.status === filter);
  }, [requests, filter]);

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
      addToast('success', `Seat #${req.seat} allotted to ${req.userName}`);
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
    if (result.ok) addToast('warning', `Request for Seat #${seat} rejected`);
    else addToast('error', result.error ?? 'Could not reject this request.');
  };

  const handleDelete = async (id: string | number) => {
    const result = await deleteRequest(id);
    if (result.ok) addToast('warning', 'Request deleted');
    else addToast('error', result.error ?? 'Could not delete this request.');
  };

  const tabs: { key: FilterTab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'pending', label: 'Pending', icon: <Clock className="w-3.5 h-3.5" />, count: counts.pending },
    { key: 'waitlisted', label: 'Waitlist', icon: <Hourglass className="w-3.5 h-3.5" />, count: counts.waitlisted },
    { key: 'approved', label: 'Approved', icon: <CheckCircle className="w-3.5 h-3.5" />, count: counts.approved },
    { key: 'rejected', label: 'Rejected', icon: <XCircle className="w-3.5 h-3.5" />, count: counts.rejected },
    { key: 'all', label: 'All', icon: <Filter className="w-3.5 h-3.5" />, count: counts.all },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Seat Requests"
        icon={<Inbox className="h-5 w-5" />}
        subtitle="Review and verify payments for seat requests."
        badge={counts.pending > 0 ? (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--saffron-600)] text-[var(--text-inverse)] animate-pulse">
            {counts.pending} new
          </span>
        ) : undefined}
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-1 shadow-[var(--shadow-sm)] mb-5 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-lg)] text-xs font-bold transition-ui duration-200 cursor-pointer whitespace-nowrap hover:-translate-y-[1px] hover:shadow-[var(--shadow-sm)] active:scale-95',
              filter === tab.key
                ? 'bg-[var(--saffron-600)] text-[var(--text-inverse)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)]',
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-xs font-bold',
                  filter === tab.key
                    ? 'bg-white/20 text-[var(--text-inverse)]'
                    : 'bg-[var(--bg-muted)] text-[var(--text-tertiary)]'
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
            <div className="w-14 h-14 rounded-[var(--radius-2xl)] bg-[var(--bg-overlay)] flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-7 h-7 text-[var(--text-tertiary)]" />
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
                'overflow-hidden shadow-[var(--shadow-sm)]',
                req.status === 'pending' && 'border-l border-l-[var(--sapphire-500)]',
                req.status === 'approved' && 'border-l border-l-[var(--emerald-500)]',
                req.status === 'rejected' && 'border-l border-l-[var(--ruby-500)]',
                req.status === 'waitlisted' && 'border-l border-l-[var(--marigold-500)]',
              )}
            >
              <div className="p-4">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-[var(--radius-xl)] flex items-center justify-center text-sm font-mono font-black',
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
                          <Armchair className="w-3 h-3" />
                          Seat #{req.seat}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {req.userPhone}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {fmtDate(req.joinDate || todayISO())}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1 capitalize">
                          <Clock className="w-3 h-3" />
                          {durationLabel(req.duration || '3M')} · {shiftLabel(req.shift || 'full')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-[var(--text-tertiary)] whitespace-nowrap">
                    {fmtDate(req.createdAt.toString().split('T')[0])}
                  </span>
                </div>

                {/* Payment Info */}
                <div className="mb-3 px-3 py-2 rounded-[var(--radius-lg)] bg-[var(--bg-muted)] border border-[var(--border-subtle)] flex items-center gap-2">
                  {req.paymentMode === 'cash' ? (
                    <>
                      <div className="w-7 h-7 rounded-lg bg-[var(--emerald-50)] flex items-center justify-center flex-shrink-0">
                        <Banknote className="w-3.5 h-3.5 text-[var(--emerald-600)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-[var(--emerald-600)] block">Cash Payment</span>
                        <span className="text-xs text-[var(--text-tertiary)]">Verify cash received at counter</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-7 h-7 rounded-lg bg-[var(--saffron-50)] flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-3.5 h-3.5 text-[var(--saffron-600)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-[var(--emerald-600)] block">UPI Payment</span>
                        {req.transactionId && (
                          <span className="text-xs font-mono text-[var(--text-secondary)] break-all">Ref: {req.transactionId}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Document Preview */}
                {req.documentUrl && (
                  <div className="mb-3 px-3 py-2 rounded-[var(--radius-lg)] bg-[var(--sapphire-50)] border border-[var(--sapphire-200)]">
                    <span className="text-xs font-bold text-[var(--sapphire-600)] flex items-center gap-1.5 mb-2">
                      <FileText className="w-3 h-3" /> ID Document Submitted
                    </span>
                    {req.documentUrl.startsWith('data:image') ? (
                      <div className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={req.documentUrl}
                          alt="ID Document"
                          className="w-full max-h-32 object-cover rounded-lg border border-[var(--border-default)]"
                        />
                        <a
                          href={req.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ) : (
                      <a
                        href={req.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--text-link)] underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> View Document
                      </a>
                    )}
                  </div>
                )}

                {/* Message */}
                {req.message && (
                  <div className="mb-3 px-3 py-2 rounded-[var(--radius-lg)] bg-[var(--bg-muted)] border border-[var(--border-subtle)]">
                    <span className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
                      <MessageSquare className="w-3 h-3 mt-0.5 shrink-0 text-[var(--text-tertiary)]" />
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
                        <Check className="w-3.5 h-3.5 mr-1" /> Approve and allot
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-[36px] flex-1 border border-[var(--ruby-200)] bg-[var(--ruby-50)] text-xs text-[var(--ruby-600)] hover:bg-[var(--ruby-100)]"
                        onClick={() => handleReject(req.id, req.seat)}
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  {req.status !== 'pending' && (
                    <Button
                      variant="ghost"
                      className="px-3 py-2 h-auto text-xs text-[var(--text-tertiary)] hover:text-[var(--ruby-600)] hover:bg-[var(--ruby-50)] ml-auto"
                      onClick={() => handleDelete(req.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
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
