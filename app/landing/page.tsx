'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMembers } from '@/hooks/useMembers';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import { 
  ArrowRight, Play, Sun, Moon, ShieldCheck, Droplets, VolumeX, Wind, Wifi, Armchair, CalendarDays
} from 'lucide-react';

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
  const { members } = useMembers();

  const stats = useMemo(() => {
    let vacant = 0;
    for (const m of members) {
      if (m.vacant) vacant++;
    }
    return { vacant, total: members.length };
  }, [members]);

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-[var(--text-primary)] font-body selection:bg-[var(--saffron-500)] selection:text-[var(--bg-void)] flex flex-col">
      <UnifiedHeader />

      <main className="flex-1 flex flex-col max-w-[1440px] mx-auto w-full p-4 md:p-6 lg:p-8 gap-12 lg:gap-24">
        
        {/* ── Hero Section ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-4 lg:mt-8">
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
                  <div className="text-3xl font-black text-[var(--text-primary)]">{stats.vacant || '--'} <span className="text-sm font-medium text-[var(--text-secondary)]">Seats Available</span></div>
                  <div className="text-xs text-[var(--text-tertiary)] font-medium">out of {stats.total || 95}</div>
                </div>
              </div>
              
              <div className="flex flex-col gap-1 border-l border-[var(--border-default)] pl-6 py-2">
                <div className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                  Live seat status <span className="w-2 h-2 rounded-full bg-[var(--emerald-500)] inline-block" />
                </div>
                <div className="text-xs text-[var(--text-tertiary)]">Updated just now</div>
              </div>
            </div>
            
            <button 
              onClick={() => router.push('/browse')}
              className="bg-[var(--saffron-700)] hover:bg-[var(--saffron-800)] text-white text-base font-semibold px-8 py-4 rounded-xl flex items-center justify-between w-full sm:w-[320px] transition-colors shadow-sm cursor-pointer"
            >
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

        {/* ── Features Footer ── */}
        <footer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 pt-12 border-t border-[var(--border-default)] pb-12">
          {AMENITIES.map(({ name, desc, Icon }) => (
            <div key={name} className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center shrink-0 text-[var(--text-tertiary)]">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)]">{name}</div>
                <div className="text-xs text-[var(--text-secondary)]">{desc}</div>
              </div>
            </div>
          ))}
        </footer>

      </main>
    </div>
  );
}
