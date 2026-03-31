'use client';

import { useState, useMemo, useCallback } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import { useSeatRequests } from '@/hooks/useSeatRequests';
import { useToast } from '@/hooks/useToast';
import { type Member, type Shift } from '@/lib/types';
import { getSeatStatus, cn, firstName } from '@/lib/utils';
import SeatRequestSheet from '@/components/seat/SeatRequestSheet';
import {
  Grid3X3,
  Sun,
  Moon,
  Layers,
  Eye,
  LogOut,
  Inbox,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BrowsePage() {
  const { members } = useMembers();
  const { logout } = useAuth();
  const { addRequest, requests } = useSeatRequests();
  const { addToast } = useToast();
  const router = useRouter();

  const [shiftFilter, setShiftFilter] = useState<Shift | 'all'>('all');
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (shiftFilter === 'all') return members;
    return members.filter(m => {
      if (m.vacant) return true;
      return m.shift === shiftFilter || m.shift === 'full';
    });
  }, [members, shiftFilter]);

  const stats = useMemo(() => {
    let occupied = 0, vacant = 0;
    for (const m of members) {
      if (m.vacant) vacant++;
      else occupied++;
    }
    return { occupied, vacant };
  }, [members]);

  const selectedMember = selectedSeat !== null
    ? members.find(m => m.seat === selectedSeat && m.vacant) || null
    : null;

  const handleSeatClick = useCallback((seat: number) => {
    const member = members.find(m => m.seat === seat);
    if (member?.vacant) {
      // Check if user already has a pending request for this seat
      const existingRequest = requests.find(
        r => r.seat === seat && r.status === 'pending'
      );
      if (existingRequest) {
        addToast('warning', `You already have a pending request for Seat #${seat}`);
        return;
      }
      setSelectedSeat(seat);
    }
  }, [members, requests, addToast]);

  const handleSubmitRequest = (seat: number, name: string, phone: string, message: string) => {
    addRequest(seat, name, phone, message);
    addToast('success', `Seat #${seat} request submitted!`);
  };

  const handleLogout = () => {
    logout();
    router.push('/landing');
  };

  const myPendingRequests = requests.filter(r => r.status === 'pending').length;

  const shifts: { value: Shift | 'all'; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All', icon: <Layers className="w-3.5 h-3.5" /> },
    { value: 'morning', label: 'Morning', icon: <Sun className="w-3.5 h-3.5" /> },
    { value: 'evening', label: 'Evening', icon: <Moon className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary dark:text-text-primary-dark tracking-tight flex items-center gap-2">
            <Eye className="w-6 h-6 text-blue-accent" />
            Browse Seats
          </h1>
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-0.5">
            {stats.occupied} occupied · <span className="text-active-border font-bold">{stats.vacant} vacant</span> · Tap a vacant seat to request it
          </p>
        </div>
        <div className="flex items-center gap-2">
          {myPendingRequests > 0 && (
            <button
              onClick={() => addToast('success', `You have ${myPendingRequests} pending request(s)`)}
              className="cursor-pointer relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold bg-blue-accent/10 text-blue-accent hover:bg-blue-accent/15 transition-colors"
            >
              <Inbox className="w-4 h-4" />
              <span className="hidden sm:inline">My Requests</span>
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-accent text-white text-[10px] font-bold flex items-center justify-center">
                {myPendingRequests}
              </span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-text-secondary dark:text-text-secondary-dark bg-bg dark:bg-bg-dark hover:text-expired-border transition-colors border border-card-border dark:border-card-border-dark"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Shift Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1 bg-surface dark:bg-surface-dark border border-card-border dark:border-card-border-dark rounded-xl p-1 shadow-sm">
          {shifts.map(s => (
            <button
              key={s.value}
              onClick={() => setShiftFilter(s.value)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer',
                shiftFilter === s.value
                  ? 'bg-blue-accent text-white shadow-sm'
                  : 'text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark hover:bg-bg dark:hover:bg-bg-dark',
              )}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold shadow-sm bg-active-fill dark:bg-active-fill-dark text-active-text dark:text-active-text-dark border-active-border/30">
            <span className="text-base font-black">{stats.occupied}</span>
            Occupied
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold shadow-sm bg-vacant-fill dark:bg-vacant-fill-dark text-text-secondary dark:text-text-secondary-dark border-vacant-border dark:border-vacant-border-dark">
            <span className="text-base font-black">{stats.vacant}</span>
            Vacant
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-[11px] font-bold text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
        {[
          { cls: 'bg-active-fill dark:bg-active-fill-dark ring-active-border', label: 'Occupied' },
          { cls: 'bg-vacant-fill dark:bg-vacant-fill-dark ring-vacant-border dark:ring-vacant-border-dark', label: 'Vacant (Tap to request)' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={cn('w-3 h-3 rounded-md ring-2', l.cls)} />
            {l.label}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="card-premium accent-blue rounded-2xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-card-border dark:border-card-border-dark">
          <Grid3X3 className="w-4 h-4 text-blue-accent" />
          <h3 className="text-sm font-black text-text-primary dark:text-text-primary-dark">
            {shiftFilter === 'all' ? 'All Seats' : `${shiftFilter.charAt(0).toUpperCase() + shiftFilter.slice(1)} Shift`}
          </h3>
          <span className="text-xs font-mono font-bold text-text-tertiary ml-auto">
            {filtered.length} seats
          </span>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-2 sm:gap-2.5 justify-items-center">
          {filtered.map(member => (
            <BrowseSeatTile
              key={member.seat}
              member={member}
              onClick={handleSeatClick}
              hasRequest={requests.some(r => r.seat === member.seat && r.status === 'pending')}
            />
          ))}
        </div>
      </div>

      {/* Request Sheet */}
      <SeatRequestSheet
        member={selectedMember}
        open={selectedSeat !== null && selectedMember !== null}
        onClose={() => setSelectedSeat(null)}
        onSubmit={handleSubmitRequest}
      />
    </div>
  );
}

/* ─── Browse Seat Tile ────────────────────────────────────────── */

function BrowseSeatTile({
  member,
  onClick,
  hasRequest,
}: {
  member: Member;
  onClick: (seat: number) => void;
  hasRequest: boolean;
}) {
  const status = getSeatStatus(member);
  const isVacant = member.vacant;

  return (
    <button
      onClick={() => onClick(member.seat)}
      disabled={!isVacant}
      className={cn(
        'relative flex flex-col items-center justify-between rounded-xl border transition-all duration-200 w-[74px] h-[74px] p-2',
        isVacant
          ? 'tile-vacant cursor-pointer hover:ring-2 hover:ring-blue-accent/40 hover:scale-105 hover:shadow-lg active:scale-95'
          : 'cursor-default opacity-80',
        !isVacant && status === 'active' && 'tile-active',
        !isVacant && status === 'expiring' && 'tile-expiring',
        !isVacant && status === 'expired' && 'tile-expired',
        !isVacant && status === 'due' && 'tile-due',
      )}
    >
      {/* Seat number */}
      <span className="font-mono font-bold self-start leading-none text-xs">
        {String(member.seat).padStart(2, '0')}
      </span>

      {/* Name or status */}
      {isVacant ? (
        <span className="text-[10px] font-bold text-active-border">
          {hasRequest ? '⏳ Req' : 'Vacant'}
        </span>
      ) : (
        <span className="text-[11px] font-black truncate w-full text-center leading-tight">
          {firstName(member.name)}
        </span>
      )}

      {/* Shift indicator */}
      <div className="flex items-center gap-0.5 text-[9px] font-bold">
        {isVacant ? (
          <span className="font-medium opacity-60">
            {hasRequest ? 'Sent' : 'Tap'}
          </span>
        ) : (
          <>
            {member.shift === 'evening' ? (
              <Moon className="w-3 h-3" />
            ) : member.shift === 'full' ? (
              <span className="flex items-center gap-0.5">
                <Sun className="w-2.5 h-2.5" />
                <Moon className="w-2.5 h-2.5" />
              </span>
            ) : (
              <Sun className="w-3 h-3" />
            )}
          </>
        )}
      </div>

      {/* Pending request indicator */}
      {hasRequest && (
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-accent border-2 border-white dark:border-[#121212] shadow-sm" />
      )}
    </button>
  );
}
