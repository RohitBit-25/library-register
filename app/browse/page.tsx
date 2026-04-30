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
import { Grid3X3, Sun, Moon, Layers, LogOut, Inbox, Wind, VolumeX, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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
    return members.filter(m => m.vacant || m.shift === shiftFilter || m.shift === 'full');
  }, [members, shiftFilter]);

  const stats = useMemo(() => {
    let occupied = 0, vacant = 0;
    for (const m of members) m.vacant ? vacant++ : occupied++;
    return { occupied, vacant, total: members.length };
  }, [members]);

  const selectedMember = selectedSeat !== null
    ? members.find(m => m.seat === selectedSeat && m.vacant) ?? null
    : null;

  const handleSeatClick = useCallback((seat: number) => {
    const member = members.find(m => m.seat === seat);
    if (!member?.vacant) return;
    if (requests.some(r => r.seat === seat && r.status === 'pending')) {
      addToast('warning', `Already have a pending request for Seat #${seat}`);
      return;
    }
    setSelectedSeat(seat);
  }, [members, requests, addToast]);

  const handleSubmitRequest = async (
    seat: number, name: string, phone: string, message: string,
    transactionId: string, paymentMode: 'upi' | 'cash', documentUrl: string
  ) => {
    const result = await addRequest({
      seat,
      userName: name,
      userPhone: phone,
      message,
      transactionId,
      paymentMode,
      documentUrl,
    });
    if (result.success) addToast('success', `Seat #${seat} request submitted.`);
    return result;
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const shiftTabs: { value: Shift | 'all'; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All Shifts', icon: <Layers className="w-4 h-4" /> },
    { value: 'morning', label: 'Morning', icon: <Sun className="w-4 h-4" /> },
    { value: 'evening', label: 'Evening', icon: <Moon className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-[var(--text-primary)] font-body relative selection:bg-[var(--saffron-500)] selection:text-[var(--bg-void)] pb-20 overflow-x-hidden">
      {/* Background Ambient Effects */}
      <div className="fixed inset-0 pointer-events-none noise-pattern mix-blend-overlay opacity-30 z-0"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--saffron-500)]/5 blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--sapphire-400)]/5 blur-[120px] pointer-events-none z-0"></div>

      {/* ── Top bar / Header ── */}
      <header className="sticky top-0 z-40 glass-elite border-b border-[var(--border-default)]/50 px-4 md:px-8 py-4 mb-8 w-full backdrop-blur-3xl shadow-sm">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap"
        >
          {/* Title & Branding */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--sapphire-400)]/10 border border-[var(--sapphire-400)]/30 flex items-center justify-center shrink-0 shadow-[var(--shadow-glow-sapphire)]">
              <Grid3X3 className="w-6 h-6 text-[var(--sapphire-400)]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight">
                Library Seats
              </h1>
              <p className="text-xs md:text-sm text-[var(--text-secondary)] font-medium flex items-center gap-2 mt-0.5">
                <span className="text-[var(--emerald-400)]">{stats.occupied} Occupied</span>
                <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />
                <span className="text-[var(--sapphire-400)]">{stats.vacant} Vacant</span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <button
                className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--sapphire-400)]/10 border border-[var(--sapphire-400)]/30 text-[var(--sapphire-400)] font-bold text-xs hover:bg-[var(--sapphire-400)]/20 transition-all shadow-[var(--shadow-glow-sapphire)] active:scale-95"
                onClick={() => addToast('success', `${pendingCount} pending request(s)`)}
              >
                <Inbox className="w-4 h-4" />
                <span className="bg-[var(--sapphire-400)] text-[var(--bg-void)] px-1.5 py-0.5 rounded-md text-[10px] leading-none">
                  {pendingCount}
                </span>
              </button>
            )}
            <button
              className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)] font-medium text-xs hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all active:scale-95"
              onClick={() => { logout(); router.push('/landing'); }}
            >
              <LogOut className="w-4 h-4" />
              Exit
            </button>
          </div>
        </motion.div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 space-y-8">
        
        {/* ── Stat pills ── */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
        >
          {[
            { label: 'Occupied', value: stats.occupied, color: 'var(--emerald-400)', glow: 'var(--shadow-glow-emerald)' },
            { label: 'Available', value: stats.vacant, color: 'var(--sapphire-400)', glow: 'var(--shadow-glow-sapphire)' },
            { label: 'Total Seats', value: stats.total, color: 'var(--text-primary)', glow: 'none' },
          ].map((stat, i) => (
            <div key={stat.label} className={cn("card-base p-5 md:p-6 flex flex-col justify-between relative overflow-hidden group", i === 2 && "col-span-2 md:col-span-1")}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 opacity-20 group-hover:opacity-40 transition-opacity" />
              <span className="text-[10px] md:text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">
                {stat.label}
              </span>
              <div className="flex items-end justify-between">
                <span className="text-4xl md:text-5xl font-display font-black leading-none" style={{ color: stat.color, textShadow: stat.glow !== 'none' ? `0 0 24px ${stat.color}80` : 'none' }}>
                  {stat.value}
                </span>
                {stat.label !== 'Total Seats' && (
                   <div className="w-16 h-1.5 rounded-full bg-[var(--bg-muted)] overflow-hidden hidden sm:block">
                     <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(stat.value / stats.total) * 100}%`, background: stat.color }} />
                   </div>
                )}
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Filters row ── */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          {/* Shift Filter */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] p-1.5 rounded-2xl shadow-sm w-full md:w-auto overflow-x-auto no-scrollbar">
            {shiftTabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setShiftFilter(tab.value)}
                className={cn(
                  "cursor-pointer flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 capitalize tracking-wide flex-1 md:flex-auto whitespace-nowrap",
                  shiftFilter === tab.value
                    ? "bg-[var(--saffron-500)] text-[var(--bg-void)] shadow-[var(--shadow-glow-saffron)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]/40"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 md:gap-5 flex-wrap bg-[var(--bg-surface)]/50 px-4 py-2.5 rounded-2xl border border-[var(--border-default)]/50 w-full md:w-auto">
            {[
              { color: 'var(--emerald-500)', label: 'Occupied' },
              { color: 'var(--sapphire-400)', label: 'Vacant' },
              { color: 'var(--amber-500)', label: 'Expiring' },
              { color: 'var(--ruby-500)', label: 'Expired' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-2 ring-offset-[var(--bg-void)]" style={{ background: l.color, '--tw-ring-color': `${l.color}40` } as React.CSSProperties} />
                {l.label}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Map card ── */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card-base glass-elite-panel overflow-hidden border-[var(--border-strong)]"
        >
          {/* Map Header */}
          <div className="px-6 py-5 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/50 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Grid3X3 className="w-5 h-5 text-[var(--saffron-500)]" />
              <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">
                {shiftFilter === 'all' ? 'Full Floorplan' : `${shiftFilter} Shift`}
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-[var(--text-tertiary)] bg-[var(--bg-muted)]/50 px-3 py-1.5 rounded-lg border border-[var(--border-default)]">
              {filtered.length} Seats
            </span>
          </div>

          {/* Map Area */}
          <div className="p-4 sm:p-6 md:p-8 bg-[var(--bg-void)]/40 min-h-[500px] flex justify-center">
              <motion.div
                className="w-full max-w-[800px]"
              >
                <SeatMapContainer>
                  <AnimatePresence>
                    {filtered.map(member => (
                      <SeatMapWrapper key={member.seat} seatNum={member.seat}>
                        {(face: FaceDir) => (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="w-full h-full"
                          >
                            <BrowseSeatTile
                              member={member}
                              face={face}
                              onClick={handleSeatClick}
                              hasRequest={requests.some(r => r.seat === member.seat && r.status === 'pending')}
                            />
                          </motion.div>
                        )}
                      </SeatMapWrapper>
                    ))}
                  </AnimatePresence>
                </SeatMapContainer>
              </motion.div>
          </div>
        </motion.div>
      </main>

      {/* ── Request sheet ── */}
      <SeatRequestSheet
        member={selectedMember}
        open={selectedSeat !== null && selectedMember !== null}
        onClose={() => setSelectedSeat(null)}
        onSubmit={handleSubmitRequest}
      />
    </div>
  );
}

// ─── Seat Tile ────────────────────────────────────────────────────────────────

function BrowseSeatTile({
  member,
  face,
  onClick,
  hasRequest,
}: {
  member: Member;
  face: FaceDir;
  onClick: (seat: number) => void;
  hasRequest: boolean;
}) {
  const status = getSeatStatus(member);
  const isVacant = member.vacant;

  const tileClass = isVacant 
    ? "bg-[var(--bg-surface)] border-[var(--border-strong)] hover:border-[var(--sapphire-400)]/70 hover:bg-[var(--sapphire-400)]/15 hover:shadow-[var(--shadow-glow-sapphire)] cursor-pointer hover:scale-[1.08] hover:z-20"
    : status === 'expiring' ? "bg-[var(--amber-500)]/10 border-[var(--amber-500)]/30"
    : status === 'expired' ? "bg-[var(--ruby-500)]/10 border-[var(--ruby-500)]/30"
    : status === 'due' ? "bg-[var(--ruby-500)]/15 border-[var(--ruby-500)]/40"
    : "bg-[var(--emerald-500)]/10 border-[var(--emerald-500)]/30";

  const shiftIcon = member.shift === 'evening' ? <Moon className="w-[10px] h-[10px]" />
    : member.shift === 'full' ? <div className="flex gap-[2px]"><Sun className="w-2.5 h-2.5" /><Moon className="w-2.5 h-2.5" /></div>
    : <Sun className="w-[10px] h-[10px]" />;

  // Mock amenities based on seat num for the tooltip
  const isWindow = member.seat % 4 === 0 || member.seat > 80;
  const isAC = member.seat % 3 === 0;
  const isSilent = member.seat > 40 && member.seat < 60;

  const amenities = [
    isWindow && { label: 'Near Window', icon: Eye },
    isAC && { label: 'Cooling Zone', icon: Wind },
    isSilent && { label: 'Silent Corner', icon: VolumeX }
  ].filter(Boolean) as { label: string; icon: any }[];

  return (
    <div className="group relative w-full h-full">
      <button
        onClick={() => isVacant && onClick(member.seat)}
        className={cn(
          'relative flex flex-col items-center justify-between rounded-xl w-full h-full py-1.5 px-1 transition-all duration-300 border backdrop-blur-sm',
          tileClass,
          isVacant ? 'active:scale-95' : 'cursor-default'
        )}
        aria-label={`Seat ${member.seat} — ${isVacant ? 'vacant' : member.name}`}
      >
        {/* Chair Indicator */}
        <div className={cn(
          "absolute rounded-full bg-[var(--bg-muted)] opacity-50",
          face === 'up' && "bottom-[-5px] left-[20%] right-[20%] h-[3px]",
          face === 'down' && "top-[-5px] left-[20%] right-[20%] h-[3px]",
          face === 'left' && "right-[-5px] top-[20%] bottom-[20%] w-[3px]",
          face === 'right' && "left-[-5px] top-[20%] bottom-[20%] w-[3px]"
        )} />

        <span className="text-[11px] font-bold text-[var(--text-secondary)] self-start leading-none pl-0.5">
          {String(member.seat).padStart(2, '0')}
        </span>

        {isVacant ? (
          <span className={cn(
            "text-[10px] font-bold tracking-wider uppercase mt-1",
            hasRequest ? "text-[var(--amber-500)]" : "text-[var(--sapphire-400)]"
          )}>
            {hasRequest ? 'Pending' : 'Vacant'}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-[var(--text-primary)] text-center w-full leading-tight truncate px-0.5">
            {firstName(member.name)}
          </span>
        )}

        <div className={cn(
          "flex items-center gap-0.5 mt-1",
          isVacant ? "text-[var(--text-tertiary)]" : "text-[var(--text-secondary)]"
        )}>
          {isVacant ? (
             <span className="text-[9px] tracking-widest uppercase font-medium">
               {hasRequest ? '⏳' : 'Tap'}
             </span>
          ) : shiftIcon}
        </div>

        {hasRequest && (
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--amber-500)] border-2 border-[var(--bg-surface)] animate-pulse" />
        )}
      </button>

      {/* Tooltip for vacant seats */}
      {isVacant && amenities.length > 0 && (
        <div className="absolute bottom-[115%] left-1/2 -translate-x-1/2 mb-1 w-max min-w-[120px] bg-[var(--bg-base)]/95 backdrop-blur-xl border border-[var(--saffron-500)]/30 rounded-xl p-3 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all duration-300 z-[999] origin-bottom">
          <div className="text-[9px] font-black text-[var(--saffron-500)] mb-2 uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 border-b border-[var(--saffron-500)]/20 pb-1.5">
            <span className="w-1.5 h-1.5 bg-[var(--saffron-500)] rounded-full animate-pulse shadow-[0_0_8px_var(--saffron-500)]" />
            Amenities
          </div>
          <ul className="space-y-2">
            {amenities.map(a => (
              <li key={a.label} className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)]">
                <a.icon className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                {a.label}
              </li>
            ))}
          </ul>
          {/* Tooltip arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[var(--bg-base)]/95 border-b border-r border-[var(--saffron-500)]/30 rotate-45 backdrop-blur-xl" />
        </div>
      )}
    </div>
  );
}