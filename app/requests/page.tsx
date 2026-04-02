'use client';

import { useState, useMemo } from 'react';
import { useSeatRequests } from '@/hooks/useSeatRequests';
import { useToast } from '@/hooks/useToast';
import { fmtDate, cn } from '@/lib/utils';
import { type SeatRequest } from '@/lib/types';
import {
  Inbox,
  Check,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  MessageSquare,
  Armchair,
  Filter,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

type FilterTab = 'pending' | 'approved' | 'rejected' | 'all';

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
    let pending = 0, approved = 0, rejected = 0;
    for (const r of requests) {
      if (r.status === 'pending') pending++;
      else if (r.status === 'approved') approved++;
      else rejected++;
    }
    return { pending, approved, rejected, all: requests.length };
  }, [requests]);

  const handleApprove = (req: SeatRequest) => {
    approveRequest(req.id);
    addToast('success', `Request for Seat #${req.seat} approved`);
    // Navigate to add member page for this seat and pass metadata to auto-fill
    const query = new URLSearchParams({
      seat: String(req.seat),
      name: req.userName,
      phone: req.userPhone,
      paymentMode: 'upi'
    });
    router.push(`/?${query.toString()}`);
  };

  const handleReject = (id: string | number, seat: number) => {
    rejectRequest(id);
    addToast('warning', `Request for Seat #${seat} rejected`);
  };

  const handleDelete = (id: string | number) => {
    deleteRequest(id);
    addToast('warning', 'Request deleted');
  };

  const tabs: { key: FilterTab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'pending', label: 'Pending', icon: <Clock className="w-3.5 h-3.5" />, count: counts.pending },
    { key: 'approved', label: 'Approved', icon: <CheckCircle className="w-3.5 h-3.5" />, count: counts.approved },
    { key: 'rejected', label: 'Rejected', icon: <XCircle className="w-3.5 h-3.5" />, count: counts.rejected },
    { key: 'all', label: 'All', icon: <Filter className="w-3.5 h-3.5" />, count: counts.all },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[var(--text-xl)] sm:text-[var(--text-2xl)] font-[var(--weight-extrabold)] text-[var(--text-primary)] dark:text-[var(--text-primary-dark)] tracking-tight flex items-center gap-[var(--space-2)]">
          <Inbox className="w-6 h-6 text-[var(--indigo-500)]" />
          Seat Requests
          {counts.pending > 0 && (
            <span className="px-[var(--space-2)] py-[var(--space-0\.5)] rounded-[var(--radius-full)] text-[var(--text-xs)] font-[var(--weight-bold)] bg-[var(--indigo-500)] text-[var(--text-inverse)] animate-pulse-subtle">
              {counts.pending} new
            </span>
          )}
        </h1>
        <p className="text-[var(--text-sm)] text-[var(--text-secondary)] mt-0.5">
          Review and verify payments for seat requests
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-[var(--space-1)] bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-default)] rounded-[var(--radius-xl)] p-[var(--space-1)] shadow-[var(--shadow-sm)] mb-5 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'flex items-center gap-[var(--space-1\.5)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-lg)] text-[var(--text-xs)] font-[var(--weight-bold)] transition-all duration-200 cursor-pointer whitespace-nowrap',
              filter === tab.key
                ? 'bg-[var(--indigo-500)] text-[var(--text-inverse)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span
                className={cn(
                  'px-[var(--space-1\.5)] py-[var(--space-0\.5)] rounded-[var(--radius-full)] text-[10px] font-[var(--weight-bold)]',
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
          <Card variant="base" className="p-[var(--space-10)] text-center">
            <div className="w-14 h-14 rounded-[var(--radius-2xl)] bg-[var(--bg-overlay)] flex items-center justify-center mx-auto mb-[var(--space-3)]">
              <Inbox className="w-7 h-7 text-[var(--text-tertiary)]" />
            </div>
            <p className="text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--text-secondary)]">
              {filter === 'pending'
                ? 'No pending requests'
                : filter === 'approved'
                  ? 'No approved requests'
                  : filter === 'rejected'
                    ? 'No rejected requests'
                    : 'No requests yet'}
            </p>
            <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-[var(--space-1)]">
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
                req.status === 'pending' && 'border-l-[4px] border-l-[var(--indigo-500)]',
                req.status === 'approved' && 'border-l-[4px] border-l-[var(--emerald-500)]',
                req.status === 'rejected' && 'border-l-[4px] border-l-[var(--ruby-500)]',
              )}
            >
              <div className="p-[var(--space-4)]">
                {/* Top row */}
                <div className="flex items-start justify-between mb-[var(--space-3)]">
                  <div className="flex items-center gap-[var(--space-3)]">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-[var(--radius-xl)] flex items-center justify-center text-[var(--text-sm)] font-[var(--font-mono)] font-[var(--weight-black)]',
                        req.status === 'pending' && 'bg-[var(--indigo-500)]/10 text-[var(--indigo-500)]',
                        req.status === 'approved' && 'bg-[var(--emerald-500)]/10 text-[var(--emerald-500)]',
                        req.status === 'rejected' && 'bg-[var(--ruby-500)]/10 text-[var(--ruby-500)]',
                      )}
                    >
                      {req.seat}
                    </div>
                    <div>
                      <div className="flex items-center gap-[var(--space-2)]">
                        <span className="text-[var(--text-sm)] font-[var(--weight-bold)] text-[var(--text-primary)]">
                          {req.userName}
                        </span>
                        <Badge variant={req.status === 'approved' ? 'active' : (req.status === 'rejected' ? 'expired' : 'pending')} />
                      </div>
                      <div className="flex items-center gap-[var(--space-3)] mt-0.5">
                        <span className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-[var(--space-1)]">
                          <Armchair className="w-3 h-3" />
                          Seat #{req.seat}
                        </span>
                        <span className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-[var(--space-1)]">
                          <Phone className="w-3 h-3" />
                          {req.userPhone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-[var(--font-mono)] text-[var(--text-tertiary)] whitespace-nowrap">
                    {fmtDate(req.createdAt.toString().split('T')[0])}
                  </span>
                </div>

                {/* Payment Proof Highlight */}
                {req.transactionId && (
                  <div className="mb-[var(--space-3)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-lg)] bg-[var(--emerald-500)]/10 border border-[var(--emerald-500)]/20">
                    <span className="text-[var(--text-xs)] font-[var(--weight-bold)] text-[var(--emerald-400)] block mb-0.5">
                      💳 Payment Verification Required
                    </span>
                    <span className="text-[11px] font-[var(--font-mono)] text-[var(--text-secondary)] break-all">
                      UPI Ref: {req.transactionId}
                    </span>
                  </div>
                )}

                {/* Message */}
                {req.message && (
                  <div className="mb-[var(--space-3)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-lg)] bg-[var(--bg-muted)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-xs)] text-[var(--text-secondary)] flex items-start gap-[var(--space-1\.5)]">
                      <MessageSquare className="w-3 h-3 mt-0.5 shrink-0 text-[var(--text-tertiary)]" />
                      {req.message}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-[var(--space-2)]">
                  {req.status === 'pending' && (
                    <>
                      <Button
                        variant="primary"
                        className="flex-1 text-[var(--text-xs)] h-[36px]"
                        onClick={() => handleApprove(req)}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Verify & Add
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1 text-[var(--text-xs)] h-[36px] bg-[var(--ruby-500)]/10 text-[var(--ruby-500)] hover:bg-[var(--ruby-500)]/20 border-none"
                        onClick={() => handleReject(req.id, req.seat)}
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  {req.status !== 'pending' && (
                    <Button
                      variant="ghost"
                      className="px-[var(--space-3)] py-[var(--space-2)] h-auto text-[var(--text-xs)] text-[var(--text-tertiary)] hover:text-[var(--ruby-500)] hover:bg-[var(--ruby-500)]/10 ml-auto"
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
