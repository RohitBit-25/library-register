'use client';

import { useState, useMemo, useCallback } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import { useSeatRequests } from '@/hooks/useSeatRequests';
import { useToast } from '@/hooks/useToast';
import { type Member, type Shift } from '@/lib/types';
import { getSeatStatus, cn, firstName } from '@/lib/utils';
import { SeatMapContainer, SeatMapWrapper, type FaceDir } from '@/components/seat/SeatMap';
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

  const handleSubmitRequest = (seat: number, name: string, phone: string, message: string, transactionId: string) => {
    addRequest({ seat, userName: name, userPhone: phone, message, transactionId });
    addToast('success', `Seat #${seat} and payment details submitted!`);
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
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <Eye className="w-6 h-6 text-[var(--sapphire-500)]" />
            Browse Seats
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {stats.occupied} occupied · <span className="text-active-border font-bold">{stats.vacant} vacant</span> · Tap a vacant seat to request it
          </p>
        </div>
        <div className="flex items-center gap-2">
          {myPendingRequests > 0 && (
            <button
              onClick={() => addToast('success', `You have ${myPendingRequests} pending request(s)`)}
              className="cursor-pointer relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold bg-[var(--sapphire-500)]/10 text-[var(--sapphire-500)] hover:bg-[var(--sapphire-500)]/15 transition-colors"
            >
              <Inbox className="w-4 h-4" />
              <span className="hidden sm:inline">My Requests</span>
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--sapphire-500)] text-[#1a1a16] text-[10px] font-bold flex items-center justify-center">
                {myPendingRequests}
              </span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-base)] hover:text-expired-border transition-colors border border-[var(--border-default)]"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Shift Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-1 shadow-sm">
          {shifts.map(s => (
            <button
              key={s.value}
              onClick={() => setShiftFilter(s.value)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer',
                shiftFilter === s.value
                  ? 'bg-[var(--sapphire-500)] text-[#1a1a16] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)]',
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold shadow-sm bg-vacant-fill dark:bg-vacant-fill-dark text-[var(--text-secondary)] border-vacant-border dark:border-vacant-border-dark">
            <span className="text-base font-black">{stats.vacant}</span>
            Vacant
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
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
      <div className="card-base rounded-[2.5rem] border border-[var(--border-default)] bg-[var(--bg-glass)] shadow-sm overflow-hidden mb-8">
        <div className="flex items-center gap-2 px-6 pt-5 pb-3 border-b border-card-border/50/50">
          <Grid3X3 className="w-4 h-4 text-[var(--sapphire-500)]" />
          <h3 className="text-sm font-black text-[var(--text-primary)]">
            {shiftFilter === 'all' ? 'Floorplan Map' : `${shiftFilter.charAt(0).toUpperCase() + shiftFilter.slice(1)} Shift Mapping`}
          </h3>
          <span className="text-xs font-mono font-bold text-text-tertiary ml-auto">
            {filtered.length} seats shown
          </span>
        </div>
        <SeatMapContainer>
          {filtered.map(member => (
            <SeatMapWrapper key={member.seat} seatNum={member.seat}>
              {(face) => (
                <BrowseSeatTile
                  member={member}
                  onClick={handleSeatClick}
                  hasRequest={requests.some(r => r.seat === member.seat && r.status === 'pending')}
                  face={face}
                />
              )}
            </SeatMapWrapper>
          ))}
        </SeatMapContainer>
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
  face
}: {
  member: Member;
  onClick: (seat: number) => void;
  hasRequest: boolean;
  face: FaceDir;
}) {
  const status = getSeatStatus(member);
  const isVacant = member.vacant;

  return (
    <button
      onClick={() => onClick(member.seat)}
      disabled={!isVacant}
      className={cn(
        'relative flex flex-col items-center justify-between rounded-xl border transition-all duration-200 w-full h-full p-1 z-10',
        isVacant
          ? 'tile-vacant cursor-pointer hover:ring-2 hover:ring-[var(--saffron-500)]/40 hover:scale-105 hover:shadow-lg active:scale-95'
          : 'cursor-default backdrop-blur-md bg-white/40 dark:bg-black/30 border-[var(--border-default)]',
        !isVacant && status === 'active' && 'tile-active opacity-90',
        !isVacant && status === 'expiring' && 'tile-expiring opacity-90',
        !isVacant && status === 'expired' && 'tile-expired opacity-90',
        !isVacant && status === 'due' && 'tile-due opacity-90',
      )}
    >
      {/* Chair indicator */}
      <div className={cn(
        "absolute rounded-full transition-colors",
        status === 'vacant' ? 'bg-vacant-border/50 dark:bg-vacant-border-dark/50' : 
        'bg-card-border dark:bg-card-border-dark',
        face === 'up' && "bottom-[-6px] left-[15%] right-[15%] h-[4px]",
        face === 'down' && "top-[-6px] left-[15%] right-[15%] h-[4px]",
        face === 'left' && "right-[-6px] top-[15%] bottom-[15%] w-[4px]",
        face === 'right' && "left-[-6px] top-[15%] bottom-[15%] w-[4px]"
      )} />

      {/* Seat number */}
      <span className="font-mono font-bold self-start leading-none text-[10px] z-10">
        {String(member.seat).padStart(2, '0')}
      </span>

      {/* Name or status */}
      {isVacant ? (
        <span className="text-[9px] font-bold text-active-border z-10 text-center w-full leading-[1]">
          {hasRequest ? '⏳' : 'Vac'}
        </span>
      ) : (
        <span className="text-[9px] font-black truncate w-full px-0.5 text-center leading-tight z-10 text-text-primary/70/80">
          {firstName(member.name)}
        </span>
      )}

      {/* Shift indicator */}
      <div className="flex items-center gap-0.5 text-[8px] font-bold z-10 opacity-70">
        {isVacant ? (
          <span className="font-medium opacity-60">
            {hasRequest ? 'Sent' : 'Tap'}
          </span>
        ) : (
          <>
            {member.shift === 'evening' ? (
              <Moon className="w-2.5 h-2.5" />
            ) : member.shift === 'full' ? (
              <span className="flex items-center gap-0.5">
                <Sun className="w-2 h-2" />
                <Moon className="w-2 h-2" />
              </span>
            ) : (
              <Sun className="w-2.5 h-2.5" />
            )}
          </>
        )}
      </div>

      {/* Pending request indicator */}
      {hasRequest && (
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--saffron-500)] border-2 border-[var(--bg-base)] shadow-sm z-20" />
      )}
    </button>
  );
}
