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
import { Grid3X3, Sun, Moon, Layers, LogOut, Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ─── Tokens ───────────────────────────────────────────────────────────────────
// All design tokens live here — change once, cascade everywhere.
const T = {
  bg:        '#07080d',
  surface:   '#0d0f18',
  overlay:   '#131624',
  border:    'rgba(255,255,255,0.07)',
  borderHi:  'rgba(255,255,255,0.13)',
  blue:      '#4f8ef7',
  blueGlow:  'rgba(79,142,247,0.18)',
  blueSubtle:'rgba(79,142,247,0.09)',
  green:     '#34d399',
  greenGlow: 'rgba(52,211,153,0.15)',
  amber:     '#fbbf24',
  red:       '#f87171',
  muted:     '#3d4460',
  textPrim:  '#e8eaf2',
  textSec:   '#6b7399',
  textTert:  '#3a3f5c',
  mono:      "'DM Mono', monospace",
  display:   "'Syne', sans-serif",
} as const;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BrowsePage() {
  const { members } = useMembers();
  const { logout }  = useAuth();
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
    seat: number, name: string, phone: string, message: string, transactionId: string
  ) => {
    const result = await addRequest({ seat, userName: name, userPhone: phone, message, transactionId });
    if (result.success) addToast('success', `Seat #${seat} request submitted.`);
    return result;
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const shiftTabs: { value: Shift | 'all'; label: string; icon: React.ReactNode }[] = [
    { value: 'all',     label: 'All Shifts', icon: <Layers className="w-3 h-3" /> },
    { value: 'morning', label: 'Morning',    icon: <Sun    className="w-3 h-3" /> },
    { value: 'evening', label: 'Evening',    icon: <Moon   className="w-3 h-3" /> },
  ];

  return (
    <>
      {/* Google fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');

        .bp-root { font-family: ${T.mono}; background: ${T.bg}; color: ${T.textPrim}; min-height: 100vh; padding: 28px 20px 48px; }

        /* Stat pill */
        .stat-pill { display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:12px;border:1px solid ${T.border};background:${T.surface}; }
        .stat-pill-num { font-size:22px;font-weight:700;line-height:1; }
        .stat-pill-lbl { font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${T.textSec}; }

        /* Shift tab */
        .shift-tab { display:flex;align-items:center;gap:5px;padding:7px 14px;border-radius:8px;font-size:11px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;border:none;transition:all 0.15s ease; }
        .shift-tab.active { background:${T.blue};color:#070a14; }
        .shift-tab.inactive { background:transparent;color:${T.textSec}; }
        .shift-tab.inactive:hover { background:${T.overlay};color:${T.textPrim}; }

        /* Map card */
        .map-card { border-radius:20px;border:1px solid ${T.border};background:${T.surface};overflow:hidden; }
        .map-card-header { display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid ${T.border}; }

        /* Legend dot */
        .legend-dot { width:10px;height:10px;border-radius:3px;border:1px solid; }

        /* Icon btn */
        .icon-btn { display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;border:1px solid ${T.border};background:${T.surface};font-size:11px;font-weight:500;letter-spacing:0.08em;cursor:pointer;transition:all 0.15s ease;color:${T.textSec}; }
        .icon-btn:hover { border-color:${T.borderHi};color:${T.textPrim}; }
        .icon-btn.blue { border-color:rgba(79,142,247,0.35);background:${T.blueSubtle};color:${T.blue}; }
        .icon-btn.blue:hover { background:${T.blueGlow}; }

        /* Seat tiles */
        .seat-occupied  { background:rgba(52,211,153,0.07);border:1px solid rgba(52,211,153,0.22); }
        .seat-vacant    { background:${T.overlay};border:1px solid ${T.borderHi};cursor:pointer; }
        .seat-vacant:hover { border-color:rgba(79,142,247,0.55);background:${T.blueSubtle}; transform:scale(1.06); }
        .seat-expiring  { background:rgba(251,191,36,0.07);border:1px solid rgba(251,191,36,0.25); }
        .seat-expired   { background:rgba(248,113,113,0.07);border:1px solid rgba(248,113,113,0.22); }
        .seat-due       { background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.35); }

        .seat-tile { position:relative;display:flex;flex-direction:column;align-items:center;justify-content:space-between;border-radius:9px;width:100%;height:100%;padding:5px 4px 4px;transition:all 0.14s ease; }
        .seat-tile:active { transform:scale(0.95); }

        .seat-chair { position:absolute;border-radius:99px;background:${T.muted};opacity:0.5; }
        .face-up    .seat-chair { bottom:-5px;left:18%;right:18%;height:3px; }
        .face-down  .seat-chair { top:-5px;left:18%;right:18%;height:3px; }
        .face-left  .seat-chair { right:-5px;top:18%;bottom:18%;width:3px; }
        .face-right .seat-chair { left:-5px;top:18%;bottom:18%;width:3px; }

        .seat-num { font-size:10px;font-weight:500;color:${T.textSec};align-self:flex-start;line-height:1; }
        .seat-name { font-size:9px;font-weight:600;color:${T.textPrim};text-align:center;width:100%;line-height:1.15;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 2px; }
        .seat-shift { font-size:8px;color:${T.textTert};display:flex;align-items:center;gap:2px; }

        .seat-pending-badge { position:absolute;top:-3px;right:-3px;width:7px;height:7px;border-radius:50%;background:${T.amber};border:1.5px solid ${T.surface}; }

        /* Divider */
        .divider { width:100%;height:1px;background:${T.border};margin:0; }

        /* Animate in */
        @keyframes fadeUp { from { opacity:0;transform:translateY(12px); } to { opacity:1;transform:translateY(0); } }
        .bp-root > * { animation: fadeUp 0.35s ease both; }
        .bp-root > *:nth-child(1) { animation-delay:0ms; }
        .bp-root > *:nth-child(2) { animation-delay:60ms; }
        .bp-root > *:nth-child(3) { animation-delay:110ms; }
        .bp-root > *:nth-child(4) { animation-delay:160ms; }
        .bp-root > *:nth-child(5) { animation-delay:200ms; }
      `}</style>

      <div className="bp-root">

        {/* ── Top bar ── */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width:32, height:32, borderRadius:8, background: T.blueSubtle, border:`1px solid rgba(79,142,247,0.3)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Grid3X3 size={15} color={T.blue} />
              </div>
              <h1 style={{ fontFamily: T.display, fontSize:20, fontWeight:800, color: T.textPrim, letterSpacing:'-0.01em', margin:0 }}>
                Seat Browse
              </h1>
            </div>
            <p style={{ fontSize:11, color: T.textSec, letterSpacing:'0.06em', margin:0, paddingLeft: 40 }}>
              {stats.occupied} occupied &nbsp;·&nbsp;
              <span style={{ color: T.blue, fontWeight:600 }}>{stats.vacant} vacant</span>
              &nbsp;·&nbsp; tap a vacant seat to request
            </p>
          </div>

          <div style={{ display:'flex', gap: 8 }}>
            {pendingCount > 0 && (
              <button
                className="icon-btn blue"
                onClick={() => addToast('success', `${pendingCount} pending request(s)`)}
              >
                <Inbox size={13} />
                <span style={{ display:'none' }} className="sm:inline">Requests</span>
                <span style={{ minWidth:18, height:18, borderRadius:9, background: T.blue, color:'#070a14', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>
                  {pendingCount}
                </span>
              </button>
            )}
            <button
              className="icon-btn"
              onClick={() => { logout(); router.push('/landing'); }}
            >
              <LogOut size={13} />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* ── Stat pills ── */}
        <div style={{ display:'flex', gap: 10, marginBottom: 24, flexWrap:'wrap' }}>
          <div className="stat-pill">
            <span className="stat-pill-num" style={{ color: T.green }}>{stats.occupied}</span>
            <div>
              <div className="stat-pill-lbl">Occupied</div>
              <div style={{ width: Math.round((stats.occupied / stats.total) * 64), height:2, borderRadius:1, background: T.green, marginTop:3, opacity:0.5 }} />
            </div>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-num" style={{ color: T.blue }}>{stats.vacant}</span>
            <div>
              <div className="stat-pill-lbl">Vacant</div>
              <div style={{ width: Math.round((stats.vacant / stats.total) * 64), height:2, borderRadius:1, background: T.blue, marginTop:3, opacity:0.5 }} />
            </div>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-num" style={{ color: T.textSec }}>{stats.total}</span>
            <div><div className="stat-pill-lbl">Total Seats</div></div>
          </div>
        </div>

        {/* ── Filters row ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 20, flexWrap:'wrap', gap: 12 }}>
          <div style={{ display:'flex', gap:4, background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:4 }}>
            {shiftTabs.map(tab => (
              <button
                key={tab.value}
                className={`shift-tab ${shiftFilter === tab.value ? 'active' : 'inactive'}`}
                onClick={() => setShiftFilter(tab.value)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display:'flex', gap: 14, alignItems:'center' }}>
            {[
              { color: T.green, border: 'rgba(52,211,153,0.35)',  label:'Occupied' },
              { color: T.blue,  border: 'rgba(79,142,247,0.35)',   label:'Vacant'   },
              { color: T.amber, border: 'rgba(251,191,36,0.35)',   label:'Expiring' },
              { color: T.red,   border: 'rgba(248,113,113,0.35)',  label:'Expired'  },
            ].map(l => (
              <div key={l.label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color: T.textSec }}>
                <div className="legend-dot" style={{ background:`${l.color}22`, borderColor: l.border }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Map card ── */}
        <div className="map-card">
          <div className="map-card-header">
            <Grid3X3 size={13} color={T.blue} />
            <span style={{ fontFamily: T.display, fontSize:12, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color: T.textPrim }}>
              {shiftFilter === 'all' ? 'Full Floorplan' : `${shiftFilter.charAt(0).toUpperCase() + shiftFilter.slice(1)} Shift`}
            </span>
            <span style={{ marginLeft:'auto', fontFamily: T.mono, fontSize:10, color: T.textTert, letterSpacing:'0.08em' }}>
              {filtered.length} seats
            </span>
          </div>

          <SeatMapContainer>
            {filtered.map(member => (
              <SeatMapWrapper key={member.seat} seatNum={member.seat}>
                {(face: FaceDir) => (
                  <BrowseSeatTile
                    member={member}
                    face={face}
                    onClick={handleSeatClick}
                    hasRequest={requests.some(r => r.seat === member.seat && r.status === 'pending')}
                  />
                )}
              </SeatMapWrapper>
            ))}
          </SeatMapContainer>
        </div>

      </div>

      {/* ── Request sheet ── */}
      <SeatRequestSheet
        member={selectedMember}
        open={selectedSeat !== null && selectedMember !== null}
        onClose={() => setSelectedSeat(null)}
        onSubmit={handleSubmitRequest}
      />
    </>
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
  const status   = getSeatStatus(member);
  const isVacant = member.vacant;

  const tileClass = isVacant ? 'seat-vacant'
    : status === 'expiring' ? 'seat-expiring'
    : status === 'expired'  ? 'seat-expired'
    : status === 'due'      ? 'seat-due'
    : 'seat-occupied';

  const shiftIcon = member.shift === 'evening' ? <Moon size={8} />
    : member.shift === 'full' ? <><Sun size={7} /><Moon size={7} /></>
    : <Sun size={8} />;

  return (
    <button
      onClick={() => onClick(member.seat)}
      className={cn('seat-tile', tileClass, `face-${face}`)}
      aria-label={`Seat ${member.seat} — ${isVacant ? 'vacant' : member.name}`}
    >
      <div className="seat-chair" />

      <span className="seat-num">{String(member.seat).padStart(2, '0')}</span>

      {isVacant ? (
        <span style={{ fontSize:9, fontWeight:600, color: hasRequest ? T.amber : T.blue, letterSpacing:'0.06em' }}>
          {hasRequest ? 'Pending' : 'Vacant'}
        </span>
      ) : (
        <span className="seat-name">{firstName(member.name)}</span>
      )}

      <div className="seat-shift" style={{ color: isVacant ? T.textTert : T.textSec }}>
        {isVacant
          ? <span style={{ fontSize:8, letterSpacing:'0.08em' }}>{hasRequest ? '⏳' : 'tap'}</span>
          : shiftIcon
        }
      </div>

      {hasRequest && <div className="seat-pending-badge" />}
    </button>
  );
}