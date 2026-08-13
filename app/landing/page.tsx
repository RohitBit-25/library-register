'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMembers } from '@/hooks/useMembers';
import { useSeatRequests } from '@/hooks/useSeatRequests';
import { useToast } from '@/hooks/useToast';
import { type Member, type Shift, type Duration } from '@/lib/types';
import { getSeatStatus, cn, firstName } from '@/lib/utils';
import { formatSeatmapData } from '@/lib/seatmapCanvasAdapter';
import SeatmapCanvasWrapper from '@/components/seat/SeatmapCanvasWrapper';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import StudentSidebar from '@/components/layout/StudentSidebar';
import SeatRequestSheet from '@/components/seat/SeatRequestSheet';
import { SeatSkeleton } from '@/components/ui/Skeleton';
import { 
  ArrowRight, Play, Sun, Moon, MapPin, Zap, Lightbulb, VolumeX, Maximize, 
  Wind, Wifi, ShieldCheck, Droplets, Bike, Check, AlertCircle, CalendarDays,
  User, History, Armchair
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AMENITIES = [
  { name: 'Air Conditioned', desc: 'Optimal temperature', Icon: Wind },
  { name: 'High Speed Wi-Fi', desc: 'Seamless connectivity', Icon: Wifi },
  { name: '24/7 Security', desc: 'Full CCTV coverage', Icon: ShieldCheck },
  { name: 'Purified Water', desc: 'RO filtration system', Icon: Droplets },
  { name: 'Silent Zones', desc: 'For deep focus', Icon: VolumeX },
];

const STATS = [
  { n: '95', l: 'Total Seats', icon: Armchair },
  { n: '2', l: 'Daily Shifts', icon: CalendarDays },
  { n: '6:00 AM', l: 'Opens Daily', icon: Sun },
  { n: '10:00 PM', l: 'Closes Daily', icon: Moon },
];

export default function LandingPage() {
  const router = useRouter();
  const { members, isLoading } = useMembers();
  const { addRequest, requests } = useSeatRequests();
  const { addToast } = useToast();

  const [shiftFilter, setShiftFilter] = useState<Shift | 'all'>('all');
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (shiftFilter === 'all') return members;
    return members.filter(m => m.vacant || m.shift === shiftFilter || m.shift === 'full');
  }, [members, shiftFilter]);

  const stats = useMemo(() => {
    let occupied = 0, vacant = 0;
    for (const m of members) {
      if (m.vacant) vacant++;
      else occupied++;
    }
    return { occupied, vacant, total: members.length };
  }, [members]);

  const selectedMember = selectedSeat !== null
    ? members.find(m => m.seat === selectedSeat) ?? null
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
    seat: number, name: string, phone: string, message: string, joinDate: string, duration: Duration, shift: Shift,
    transactionId: string, paymentMode: 'upi' | 'cash', documentUrl: string
  ) => {
    const result = await addRequest({
      seat, userName: name, userPhone: phone, message, joinDate, duration, shift,
      transactionId, paymentMode, documentUrl,
    });
    if (result.success) {
      addToast('success', `Seat #${seat} request submitted.`);
      setSelectedSeat(null);
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-[var(--text-primary)] font-body selection:bg-[var(--saffron-500)] selection:text-[var(--bg-void)] flex flex-col">
      <UnifiedHeader />

      <main className="flex-1 flex flex-col max-w-[1440px] mx-auto w-full p-4 md:p-6 lg:p-8 gap-8">
        
        {/* ── Hero Section ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Text */}
          <div className="flex flex-col justify-center max-w-xl">
            <div className="inline-flex items-center gap-2 bg-[var(--saffron-50)] text-[var(--saffron-700)] text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full w-max mb-6 border border-[var(--saffron-200)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--saffron-500)]" />
              Welcome to
            </div>
            
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-[var(--text-primary)] leading-[1.1] tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Shree Gangaur<br />
              <span className="text-[var(--saffron-700)]" style={{ fontFamily: 'var(--font-serif-display)' }}>Study Library</span>
            </h1>
            
            <p className="text-[var(--text-secondary)] text-base lg:text-lg mb-8 max-w-[90%] leading-relaxed">
              Your quiet place to focus. Find your seat, reserve, and make the most of your study time.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
              <div className="flex items-center gap-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl px-6 py-4 shadow-sm w-full sm:w-auto">
                <div className="w-12 h-12 rounded-full bg-[var(--emerald-50)] flex items-center justify-center shrink-0">
                  <Armchair className="w-6 h-6 text-[var(--emerald-600)]" />
                </div>
                <div>
                  <div className="text-3xl font-black text-[var(--text-primary)]">{stats.vacant} <span className="text-sm font-medium text-[var(--text-secondary)]">Seats Available</span></div>
                  <div className="text-xs text-[var(--text-tertiary)] font-medium">out of {stats.total}</div>
                </div>
              </div>
              
              <div className="flex flex-col gap-1 border-l border-[var(--border-default)] pl-6 py-2">
                <div className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                  Live seat status <span className="w-2 h-2 rounded-full bg-[var(--emerald-500)] inline-block" />
                </div>
                <div className="text-xs text-[var(--text-tertiary)]">Updated just now</div>
              </div>
            </div>
            
            <button className="bg-[var(--saffron-700)] hover:bg-[var(--saffron-800)] text-white text-base font-semibold px-8 py-4 rounded-xl flex items-center justify-between w-full sm:w-[320px] transition-colors shadow-sm">
              Choose Your Seat
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Right Image/Video & Stats */}
          <div className="flex flex-col gap-4">
            <div className="relative w-full aspect-[16/9] lg:aspect-auto lg:flex-1 rounded-3xl overflow-hidden bg-[var(--bg-muted)] border border-[var(--border-default)] group">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
              <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3 cursor-pointer group-hover:scale-105 transition-transform">
                <div className="w-16 h-16 rounded-full bg-white text-[var(--saffron-700)] flex items-center justify-center shadow-xl">
                  <Play className="w-6 h-6 ml-1" fill="currentColor" />
                </div>
                <span className="text-white font-semibold text-sm drop-shadow-md">Take a quick tour</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS.map((stat, idx) => (
                <div key={idx} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                  <stat.icon className="w-6 h-6 text-[var(--saffron-600)] mb-3" />
                  <div className="text-2xl font-black text-[var(--text-primary)]">{stat.n}</div>
                  <div className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mt-1">{stat.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Dashboard Section ── */}
        <section className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 border border-[var(--border-default)] rounded-3xl bg-[var(--bg-surface)] p-2 sm:p-4 lg:p-6 shadow-sm overflow-hidden">
          
          <StudentSidebar />

          {/* Seat Map Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 px-2">
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                <ArrowRight className="w-5 h-5 text-[var(--text-tertiary)] rotate-180 cursor-pointer hover:text-[var(--text-primary)] transition-colors" />
                Choose Your Seat
              </h2>
              
              <div className="flex items-center gap-3 text-sm">
                <select className="bg-[var(--bg-muted)] border border-[var(--border-default)] text-[var(--text-primary)] font-semibold rounded-lg px-3 py-2 outline-none cursor-pointer">
                  <option>Floor 1</option>
                  <option>Floor 2</option>
                </select>
                <select 
                  className="bg-[var(--bg-muted)] border border-[var(--border-default)] text-[var(--text-primary)] font-semibold rounded-lg px-3 py-2 outline-none cursor-pointer"
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value as Shift | 'all')}
                >
                  <option value="all">All Zones</option>
                  <option value="morning">Morning Shift</option>
                  <option value="evening">Evening Shift</option>
                </select>
                <button className="p-2 rounded-lg border border-[var(--border-default)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors">
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-[var(--bg-muted)]/30 border border-[var(--border-default)] rounded-2xl flex-1 flex flex-col relative overflow-hidden">
              
              <div className="absolute inset-0 overflow-auto p-4 sm:p-8 flex items-center justify-center">
                {isLoading ? (
                  <div className="grid w-full max-w-[800px] grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
                    {Array.from({ length: 40 }, (_, i) => <SeatSkeleton key={i} />)}
                  </div>
                ) : (
                  <div className="relative w-full max-w-[900px] mx-auto bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-8 shadow-sm">
                    {/* Simulated architectural details from mockup */}
                    <div className="absolute top-8 left-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em] -rotate-90 origin-left">
                      Reference
                    </div>
                    
                    <div className="absolute right-8 bottom-1/3 bg-[var(--bg-muted)] w-24 h-24 rounded-lg border border-[var(--border-default)] flex items-center justify-center text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-center p-2">
                      Librarian Desk
                    </div>
                    
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-[var(--bg-muted)] w-64 h-12 rounded-lg border border-[var(--border-default)] flex items-center justify-center text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.1em]">
                      Reading Table
                    </div>

                    <div className="mt-20 h-[500px] w-full">
                      <SeatmapCanvasWrapper
                        data={formatSeatmapData(filtered)}
                        options={{
                          legend: false,
                          style: {
                            seat: {
                              radius: 18,
                              hover: '#f59e0b',
                              selected: '#d97706',
                            }
                          }
                        }}
                        onSeatClick={(seat: any) => {
                          const seatNum = parseInt(seat.id, 10);
                          handleSeatClick(seatNum);
                          if (seat.selected) {
                            // Use vanilla method logic if available
                            // But usually, selection is handled via CSS classes or state internally, 
                            // we'll manage our own selection state visually.
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Legend Footer inside map container */}
              <div className="mt-auto bg-[var(--bg-surface)] border-t border-[var(--border-default)] p-4 flex flex-wrap items-center justify-center gap-6 text-[11px] font-bold text-[var(--text-secondary)]">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-md bg-[var(--emerald-100)] border border-[var(--emerald-500)] flex items-center justify-center"><Armchair className="w-2 h-2 text-[var(--emerald-600)]" /></span> Available</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-md bg-[var(--saffron-500)] text-white flex items-center justify-center"><Armchair className="w-2 h-2" /></span> Selected</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-md bg-[var(--ruby-50)] border border-[var(--ruby-300)] flex items-center justify-center"><Armchair className="w-2 h-2 text-[var(--ruby-400)]" /></span> Occupied</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-md bg-[var(--bg-muted)] border border-[var(--border-strong)] flex items-center justify-center"><Armchair className="w-2 h-2 text-[var(--text-tertiary)]" /></span> Blocked</div>
                <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-[var(--text-primary)]" /> You</div>
              </div>
            </div>
          </div>

          {/* Right Detail Sidebar */}
          <aside className="w-full lg:w-[280px] xl:w-[320px] shrink-0 flex flex-col gap-6">
            
            {selectedMember?.vacant ? (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Seat {selectedMember.seat}</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--emerald-600)] bg-[var(--emerald-50)] border border-[var(--emerald-200)] px-2 py-1 rounded-full">
                    Available
                  </span>
                </div>
                
                <div className="text-[11px] font-semibold text-[var(--text-tertiary)] flex items-center gap-1.5 mb-6">
                  <MapPin className="w-3 h-3" /> Floor 1 • Quiet Zone • Window Side
                </div>
                
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-[12px] font-medium text-[var(--text-secondary)] mb-6">
                  <div className="flex items-center gap-2"><Maximize className="w-4 h-4 text-[var(--text-tertiary)]" /> Near Window</div>
                  <div className="flex items-center gap-2"><Armchair className="w-4 h-4 text-[var(--text-tertiary)]" /> Spacious Desk</div>
                  <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-[var(--text-tertiary)]" /> Power Socket</div>
                  <div className="flex items-center gap-2"><Wifi className="w-4 h-4 text-[var(--text-tertiary)]" /> Wi-Fi Zone</div>
                  <div className="flex items-center gap-2"><Lightbulb className="w-4 h-4 text-[var(--text-tertiary)]" /> Good Lighting</div>
                  <div className="flex items-center gap-2"><Wind className="w-4 h-4 text-[var(--text-tertiary)]" /> AC Area</div>
                  <div className="flex items-center gap-2"><VolumeX className="w-4 h-4 text-[var(--text-tertiary)]" /> Quiet Area</div>
                </div>
                
                <div className="mb-8">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2">Best for</div>
                  <span className="inline-block bg-[var(--saffron-50)] text-[var(--saffron-700)] text-[11px] font-bold px-3 py-1 rounded-full border border-[var(--saffron-200)]">
                    Focused Study
                  </span>
                </div>
                
                <div className="mt-auto flex flex-col gap-3">
                  <button onClick={() => setSelectedSeat(selectedMember.seat)} className="w-full py-3.5 rounded-xl bg-[var(--saffron-700)] hover:bg-[var(--saffron-800)] text-white font-bold text-sm transition-colors">
                    Reserve This Seat
                  </button>
                  <button onClick={() => setSelectedSeat(null)} className="w-full py-3.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold text-sm transition-colors">
                    View Other Seats
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm h-full flex flex-col">
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-6">My Booking</h3>
                
                <div className="flex-1 flex flex-col items-center justify-center text-center pb-8">
                  <div className="w-32 h-32 mb-6">
                    {/* Placeholder for illustration */}
                    <svg viewBox="0 0 200 200" className="w-full h-full text-[var(--border-default)]">
                      <path fill="currentColor" d="M100 150c-27.6 0-50-22.4-50-50s22.4-50 50-50 50 22.4 50 50-22.4 50-50 50zm0-95c-24.8 0-45 20.2-45 45s20.2 45 45 45 45-20.2 45-45-20.2-45-45-45z"/>
                      <path fill="currentColor" opacity="0.5" d="M100 120v-40h-20v40h20zm0-60v20h20V60h-20z"/>
                    </svg>
                  </div>
                  <div className="text-lg font-bold text-[var(--text-primary)] mb-2">No seat booked yet</div>
                  <div className="text-[13px] text-[var(--text-secondary)] mb-8">Choose your perfect seat and get started.</div>
                  
                  <button onClick={() => setSelectedSeat(null)} className="px-6 py-2.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] border border-[var(--border-default)] text-[var(--saffron-700)] font-bold text-sm transition-colors">
                    Choose Seat
                  </button>
                </div>
              </div>
            )}
            
          </aside>
          
        </section>

        {/* ── Features Footer ── */}
        <footer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-6 border-t border-[var(--border-default)] pb-12">
          {AMENITIES.map(({ name, desc, Icon }) => (
            <div key={name} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center shrink-0 text-[var(--text-tertiary)]">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[12px] font-bold text-[var(--text-primary)]">{name}</div>
                <div className="text-[11px] text-[var(--text-secondary)]">{desc}</div>
              </div>
            </div>
          ))}
        </footer>

      </main>

      <SeatRequestSheet
        member={selectedMember}
        open={selectedSeat !== null && selectedMember?.vacant === true}
        onClose={() => setSelectedSeat(null)}
        onSubmit={handleSubmitRequest}
      />
    </div>
  );
}


