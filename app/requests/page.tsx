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
  Smartphone,
  Banknote,
  FileText,
  ExternalLink,
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
      paymentMode: req.paymentMode || 'upi',
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
        <h1 className="text-[1.25rem] sm:text-[1.5rem] font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
          <Inbox className="w-6 h-6 text-[var(--indigo-500)]" />
          Seat Requests
          {counts.pending > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[0.64rem] font-bold bg-[var(--indigo-500)] text-[var(--text-inverse)] animate-pulse">
              {counts.pending} new
            </span>
          )}
        </h1>
        <p className="text-[0.8rem] text-[var(--text-secondary)] mt-0.5">
          Review and verify payments for seat requests
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-default)] rounded-[var(--radius-xl)] p-1 shadow-[var(--shadow-sm)] mb-5 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-lg)] text-[0.64rem] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap',
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
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
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
            <p className="text-[0.8rem] font-medium text-[var(--text-secondary)]">
              {filter === 'pending'
                ? 'No pending requests'
                : filter === 'approved'
                  ? 'No approved requests'
                  : filter === 'rejected'
                    ? 'No rejected requests'
                    : 'No requests yet'}
            </p>
            <p className="text-[0.64rem] text-[var(--text-tertiary)] mt-1">
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
              <div className="p-4">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-[var(--radius-xl)] flex items-center justify-center text-[0.8rem] font-mono font-black',
                        req.status === 'pending' && 'bg-[var(--indigo-500)]/10 text-[var(--indigo-500)]',
                        req.status === 'approved' && 'bg-[var(--emerald-500)]/10 text-[var(--emerald-500)]',
                        req.status === 'rejected' && 'bg-[var(--ruby-500)]/10 text-[var(--ruby-500)]',
                      )}
                    >
                      {req.seat}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[0.8rem] font-bold text-[var(--text-primary)]">
                          {req.userName}
                        </span>
                        <Badge variant={req.status === 'approved' ? 'active' : (req.status === 'rejected' ? 'expired' : 'pending')} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1">
                          <Armchair className="w-3 h-3" />
                          Seat #{req.seat}
                        </span>
                        <span className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {req.userPhone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-[var(--text-tertiary)] whitespace-nowrap">
                    {fmtDate(req.createdAt.toString().split('T')[0])}
                  </span>
                </div>

                {/* Payment Info */}
                <div className="mb-3 px-3 py-2 rounded-[var(--radius-lg)] bg-[var(--bg-muted)] border border-[var(--border-subtle)] flex items-center gap-2">
                  {req.paymentMode === 'cash' ? (
                    <>
                      <div className="w-7 h-7 rounded-lg bg-[var(--emerald-500)]/15 flex items-center justify-center flex-shrink-0">
                        <Banknote className="w-3.5 h-3.5 text-[var(--emerald-400)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[0.64rem] font-bold text-[var(--emerald-400)] block">💵 Cash Payment</span>
                        <span className="text-[10px] text-[var(--text-tertiary)]">Verify cash received at counter</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-7 h-7 rounded-lg bg-[var(--saffron-500)]/15 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-3.5 h-3.5 text-[var(--saffron-400)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[0.64rem] font-bold text-[var(--emerald-400)] block">💳 UPI Payment</span>
                        {req.transactionId && (
                          <span className="text-[11px] font-mono text-[var(--text-secondary)] break-all">Ref: {req.transactionId}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Document Preview */}
                {req.documentUrl && (
                  <div className="mb-3 px-3 py-2 rounded-[var(--radius-lg)] bg-[var(--indigo-500)]/8 border border-[var(--indigo-500)]/20">
                    <span className="text-[0.64rem] font-bold text-[var(--indigo-400)] flex items-center gap-1.5 mb-2">
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
                        className="text-[11px] text-[var(--indigo-400)] underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> View Document
                      </a>
                    )}
                  </div>
                )}

                {/* Message */}
                {req.message && (
                  <div className="mb-3 px-3 py-2 rounded-[var(--radius-lg)] bg-[var(--bg-muted)] border border-[var(--border-subtle)]">
                    <span className="text-[0.64rem] text-[var(--text-secondary)] flex items-start gap-1.5">
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
                        className="flex-1 text-[0.64rem] h-[36px]"
                        onClick={() => handleApprove(req)}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Verify & Add
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1 text-[0.64rem] h-[36px] bg-[var(--ruby-500)]/10 text-[var(--ruby-500)] hover:bg-[var(--ruby-500)]/20 border-none"
                        onClick={() => handleReject(req.id, req.seat)}
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  {req.status !== 'pending' && (
                    <Button
                      variant="ghost"
                      className="px-3 py-2 h-auto text-[0.64rem] text-[var(--text-tertiary)] hover:text-[var(--ruby-500)] hover:bg-[var(--ruby-500)]/10 ml-auto"
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
