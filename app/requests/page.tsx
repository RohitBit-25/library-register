'use client';

import { useState, useMemo } from 'react';
import { useSeatRequests } from '@/hooks/useSeatRequests';
import { useToast } from '@/hooks/useToast';
import { fmtDate, cn } from '@/lib/utils';
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

  const handleApprove = (id: string, seat: number) => {
    approveRequest(id);
    addToast('success', `Request for Seat #${seat} approved`);
    // Navigate to add member page for this seat
    router.push(`/add?seat=${seat}`);
  };

  const handleReject = (id: string, seat: number) => {
    rejectRequest(id);
    addToast('warning', `Request for Seat #${seat} rejected`);
  };

  const handleDelete = (id: string) => {
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
        <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary dark:text-text-primary-dark tracking-tight flex items-center gap-2">
          <Inbox className="w-6 h-6 text-blue-accent" />
          Seat Requests
          {counts.pending > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-accent text-white animate-pulse-subtle">
              {counts.pending} new
            </span>
          )}
        </h1>
        <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-0.5">
          Review and manage seat requests from users
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-surface dark:bg-surface-dark border border-card-border dark:border-card-border-dark rounded-xl p-1 shadow-sm mb-5 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap',
              filter === tab.key
                ? 'bg-blue-accent text-white shadow-sm'
                : 'text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark hover:bg-bg dark:hover:bg-bg-dark',
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  filter === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-bg dark:bg-bg-dark text-text-tertiary dark:text-text-tertiary-dark'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-3 pb-20">
        {filtered.length === 0 ? (
          <div className="card-premium accent-blue rounded-2xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-bg dark:bg-bg-dark flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-7 h-7 text-text-tertiary dark:text-text-tertiary-dark" />
            </div>
            <p className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">
              {filter === 'pending'
                ? 'No pending requests'
                : filter === 'approved'
                  ? 'No approved requests'
                  : filter === 'rejected'
                    ? 'No rejected requests'
                    : 'No requests yet'}
            </p>
            <p className="text-xs text-text-tertiary dark:text-text-tertiary-dark mt-1">
              When users request seats, they&apos;ll appear here
            </p>
          </div>
        ) : (
          filtered.map(req => (
            <div
              key={req.id}
              className={cn(
                'card-premium rounded-2xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark overflow-hidden shadow-sm',
                req.status === 'pending' && 'accent-blue',
                req.status === 'approved' && 'accent-green',
                req.status === 'rejected' && 'accent-red',
              )}
            >
              <div className="p-4">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-mono font-black',
                        req.status === 'pending' && 'bg-blue-accent/10 text-blue-accent',
                        req.status === 'approved' && 'bg-active-fill dark:bg-active-fill-dark text-active-text dark:text-active-text-dark',
                        req.status === 'rejected' && 'bg-expired-fill dark:bg-expired-fill-dark text-expired-text dark:text-expired-text-dark',
                      )}
                    >
                      {req.seat}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
                          {req.userName}
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold',
                            req.status === 'pending' && 'bg-blue-accent/10 text-blue-accent',
                            req.status === 'approved' && 'bg-active-fill dark:bg-active-fill-dark text-active-text dark:text-active-text-dark',
                            req.status === 'rejected' && 'bg-expired-fill dark:bg-expired-fill-dark text-expired-text dark:text-expired-text-dark',
                          )}
                        >
                          {req.status === 'pending' ? '⏳ Pending' : req.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-text-tertiary dark:text-text-tertiary-dark flex items-center gap-1">
                          <Armchair className="w-3 h-3" />
                          Seat #{req.seat}
                        </span>
                        <span className="text-[11px] text-text-tertiary dark:text-text-tertiary-dark flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {req.userPhone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-text-tertiary dark:text-text-tertiary-dark whitespace-nowrap">
                    {fmtDate(req.createdAt.split('T')[0])}
                  </span>
                </div>

                {/* Message */}
                {req.message && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-bg/50 dark:bg-bg-dark/50 border border-card-border/50 dark:border-card-border-dark/50">
                    <span className="text-xs text-text-secondary dark:text-text-secondary-dark flex items-start gap-1.5">
                      <MessageSquare className="w-3 h-3 mt-0.5 shrink-0 text-text-tertiary" />
                      {req.message}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {req.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(req.id, req.seat)}
                        className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white gradient-green hover:shadow-lg hover:shadow-green-accent/20 active:scale-[0.98] transition-all shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve & Add
                      </button>
                      <button
                        onClick={() => handleReject(req.id, req.seat)}
                        className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-expired-text dark:text-expired-text-dark bg-expired-fill dark:bg-expired-fill-dark hover:shadow-sm active:scale-[0.98] transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </>
                  )}
                  {req.status !== 'pending' && (
                    <button
                      onClick={() => handleDelete(req.id)}
                      className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-text-tertiary dark:text-text-tertiary-dark hover:text-expired-border hover:bg-expired-fill/50 dark:hover:bg-expired-fill-dark/50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
