'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMembers } from '@/hooks/useMembers';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import { 
  ArrowRight, Sun, Moon, ShieldCheck, Droplets, VolumeX, Wind, Wifi, Armchair, CalendarDays, CheckCircle2
} from 'lucide-react';

const AMENITIES = [
  { name: 'Air Conditioned', desc: 'Optimal temperature', Icon: Wind },
  { name: 'High Speed Wi-Fi', desc: 'Seamless connectivity', Icon: Wifi },
  { name: '24/7 Security', desc: 'Full CCTV coverage', Icon: ShieldCheck },
  { name: 'Purified Water', desc: 'RO filtration system', Icon: Droplets },
  { name: 'Silent Zones', desc: 'For deep focus', Icon: VolumeX },
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
    <div className="min-h-screen bg-[var(--bg-void)] text-[var(--text-primary)] font-body selection:bg-[var(--saffron-500)] selection:text-[var(--bg-void)] flex flex-col relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--saffron-500)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-[var(--sapphire-500)]/5 rounded-full blur-[120px] pointer-events-none" />

      <UnifiedHeader />

      <main className="flex-1 flex flex-col w-full relative z-10 pb-20">
        
        {/* ── Centered Hero Text ── */}
        <section className="max-w-4xl mx-auto w-full px-4 pt-16 md:pt-24 lg:pt-32 pb-12 flex flex-col items-center text-center">
          <div className="animate-slide-up" style={{ animationFillMode: 'both' }}>
            <div className="inline-flex items-center gap-2 bg-[var(--saffron-50)] text-[var(--saffron-700)] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8 border border-[var(--saffron-200)] shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--saffron-400)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--saffron-500)]"></span>
              </span>
              Premium Study Space
            </div>
          </div>
          
          <h1 className="animate-slide-up text-5xl sm:text-6xl md:text-7xl font-black text-[var(--text-primary)] leading-[1.1] tracking-tight text-balance mb-6" style={{ fontFamily: 'var(--font-display)', animationDelay: '100ms', animationFillMode: 'both' }}>
            The perfect environment for <span className="text-[var(--saffron-700)] bg-clip-text text-transparent bg-gradient-to-r from-[var(--saffron-700)] to-[var(--saffron-500)]" style={{ fontFamily: 'var(--font-serif-display)' }}>deep work</span>
          </h1>
          
          <p className="animate-slide-up text-[var(--text-secondary)] text-lg md:text-xl mb-10 max-w-2xl leading-relaxed" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            Escape the noise. Find your dedicated seat, connect to high-speed Wi-Fi, and focus on what truly matters in a secure, AC-cooled space.
          </p>
          
          <div className="animate-slide-up flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <button 
              onClick={() => router.push('/browse')}
              className="bg-[var(--saffron-700)] hover:bg-[var(--saffron-800)] text-white text-lg font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-3 w-full sm:w-auto transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 cursor-pointer"
            >
              Check Seat Availability
              <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => document.getElementById('facilities')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white hover:bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border-default)] text-lg font-bold px-8 py-4 rounded-xl flex items-center justify-center w-full sm:w-auto transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              Explore Facilities
            </button>
          </div>
        </section>

        {/* ── Banner Image Showcase ── */}
        <section className="max-w-[1440px] mx-auto w-full px-4 md:px-6 lg:px-8 mb-20 animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
          <div className="w-full relative rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl border border-[var(--border-default)] bg-[var(--bg-muted)] flex items-center justify-center">
            <img 
              src="/banner.png" 
              alt="Shree Gangaur Library Banner" 
              className="w-full h-auto object-contain"
            />
          </div>
        </section>

        {/* ── Quick Stats Grid ── */}
        <section className="max-w-[1440px] mx-auto w-full px-4 md:px-6 lg:px-8 mb-24 animate-slide-up" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-[var(--border-default)] rounded-2xl p-8 flex items-center gap-6 shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-[var(--sapphire-50)] flex items-center justify-center shrink-0">
                <Armchair className="w-7 h-7 text-[var(--sapphire-600)]" />
              </div>
              <div>
                <div className="text-3xl font-black text-[var(--text-primary)] mb-1">95</div>
                <div className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total Seats</div>
              </div>
            </div>
            
            <div className="bg-white border border-[var(--border-default)] rounded-2xl p-8 flex items-center gap-6 shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-[var(--emerald-50)] flex items-center justify-center shrink-0">
                <Armchair className="w-7 h-7 text-[var(--emerald-600)]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-black text-[var(--text-primary)] mb-1">{stats.vacant || '--'}</div>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--emerald-400)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--emerald-500)]"></span>
                  </span>
                </div>
                <div className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Available Now</div>
              </div>
            </div>

            <div className="bg-[var(--saffron-700)] text-white rounded-2xl p-8 flex items-center gap-6 shadow-md relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')] pointer-events-none"></div>
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-sm z-10">
                <Sun className="w-7 h-7 text-white" />
              </div>
              <div className="z-10">
                <div className="text-3xl font-black mb-1">6<span className="text-xl font-bold opacity-80">am</span>-10<span className="text-xl font-bold opacity-80">pm</span></div>
                <div className="text-sm font-semibold text-white/90 uppercase tracking-wider">Open Daily</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Facilities ── */}
        <section id="facilities" className="max-w-[1440px] mx-auto w-full px-4 md:px-6 lg:px-8 animate-slide-up" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Premium Amenities</h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">Everything you need for an uninterrupted and highly productive study session.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
            {AMENITIES.map(({ name, desc, Icon }) => (
              <div key={name} className="group bg-white border border-[var(--border-default)] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-secondary)] mb-5 group-hover:bg-[var(--saffron-50)] group-hover:text-[var(--saffron-600)] transition-colors duration-300">
                  <Icon className="w-8 h-8" />
                </div>
                <div className="text-base font-bold text-[var(--text-primary)] mb-1">{name}</div>
                <div className="text-sm font-medium text-[var(--text-tertiary)]">{desc}</div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <footer className="mt-auto border-t border-[var(--border-default)] bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--saffron-50)] border border-[var(--saffron-100)] rounded-xl flex items-center justify-center">
              <span className="font-bold text-[var(--saffron-700)] text-lg" style={{ fontFamily: 'var(--font-devanagari)' }}>श्री</span>
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Shree Gangaur Study Library</p>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mt-0.5">Rajsamand, Rajasthan</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-muted)] border border-[var(--border-default)] px-4 py-2 rounded-full">
            <CalendarDays className="w-4 h-4 text-[var(--text-tertiary)]" />
            Open 6:00 am – 10:00 pm daily
          </div>
        </div>
      </footer>
    </div>
  );
}
