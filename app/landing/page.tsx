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

      <main className="flex-1 flex flex-col max-w-[1440px] mx-auto w-full p-4 md:p-6 lg:p-8 gap-12 lg:gap-16 relative z-10 pb-20">
        
        {/* ── Banner Section ── */}
        <section className="w-full relative rounded-[2rem] overflow-hidden shadow-xl animate-fade-in group border border-[var(--border-default)] bg-[var(--bg-muted)]" style={{ animationFillMode: 'both' }}>
          <img src="/banner.png" alt="Library Banner" className="w-full h-auto object-contain group-hover:scale-[1.01] transition-transform duration-700 ease-out" />
        </section>

        {/* ── Hero Section ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-4 items-center">
          
          {/* Left Text (6 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-center max-w-2xl">
            <div className="animate-slide-up" style={{ animationFillMode: 'both' }}>
              <div className="inline-flex items-center gap-2 bg-white text-[var(--saffron-700)] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full w-max mb-6 border border-[var(--saffron-200)] shadow-sm surface-lift">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--saffron-400)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--saffron-500)]"></span>
                </span>
                Welcome to
              </div>
            </div>
            
            <h1 className="animate-slide-up text-5xl sm:text-6xl lg:text-7xl font-black text-[var(--text-primary)] leading-[1.05] tracking-tight text-balance mb-6" style={{ fontFamily: 'var(--font-display)', animationDelay: '100ms', animationFillMode: 'both' }}>
              Shree Gangaur<br />
              <span className="text-[var(--saffron-700)] bg-clip-text text-transparent bg-gradient-to-r from-[var(--saffron-700)] to-[var(--saffron-500)]" style={{ fontFamily: 'var(--font-serif-display)' }}>Study Library</span>
            </h1>
            
            <p className="animate-slide-up text-[var(--text-secondary)] text-lg lg:text-xl mb-10 max-w-[90%] leading-relaxed" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
              Your quiet place to focus. Find your seat, reserve, and make the most of your study time in a premium environment.
            </p>
            
            <div className="animate-slide-up flex flex-col sm:flex-row items-center gap-4 mb-10" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
              <button 
                onClick={() => router.push('/browse')}
                className="bg-[var(--saffron-700)] hover:bg-[var(--saffron-800)] text-white text-lg font-semibold px-8 py-4 rounded-2xl flex items-center justify-center gap-3 w-full sm:w-auto transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 cursor-pointer sheen group border border-[var(--saffron-800)]"
              >
                Choose Your Seat
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={() => document.getElementById('facilities')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white hover:bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border-default)] text-lg font-semibold px-8 py-4 rounded-2xl flex items-center justify-center w-full sm:w-auto transition-all shadow-sm hover:shadow-md hover:-translate-y-1 cursor-pointer"
              >
                Explore Facilities
              </button>
            </div>
            
            <div className="animate-fade-in flex flex-wrap items-center gap-6 text-sm font-semibold text-[var(--text-tertiary)]" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--emerald-500)]" /> 24/7 Security</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--emerald-500)]" /> AC & Wi-Fi</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--emerald-500)]" /> RO Water</div>
            </div>
          </div>
          
          {/* Right Bento Box / Hero Image (6 cols) */}
          <div className="lg:col-span-6 relative mt-10 lg:mt-0 animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              
              {/* Main Image - spans 2 cols */}
              <div className="col-span-2 relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-white border border-[var(--border-default)] flex items-center justify-center p-6 sm:p-10 shadow-lg surface-lift group">
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-[var(--saffron-50)] opacity-50 pointer-events-none" />
                <img 
                  src="/assets/landing-hero.png" 
                  alt="Students studying in the library" 
                  className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-700 ease-out relative z-10"
                />
                
                {/* Floating Live Status Badge */}
                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md border border-[var(--border-default)] shadow-xl rounded-2xl p-4 flex items-center gap-4 animate-fade-in z-20" style={{ animationDelay: '800ms', animationFillMode: 'both' }}>
                  <div className="w-12 h-12 rounded-full bg-[var(--emerald-50)] flex items-center justify-center shrink-0">
                    <Armchair className="w-6 h-6 text-[var(--emerald-600)]" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-[var(--text-primary)] leading-none mb-1">{stats.vacant || '--'}</div>
                    <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Seats Available</div>
                  </div>
                </div>
              </div>
              
              {/* Stat 1: Total Seats */}
              <div className="bg-white border border-[var(--border-default)] rounded-[1.5rem] p-6 flex flex-col shadow-sm surface-lift">
                <div className="w-12 h-12 rounded-full bg-[var(--sapphire-50)] flex items-center justify-center mb-4">
                  <Armchair className="w-6 h-6 text-[var(--sapphire-600)]" />
                </div>
                <div className="text-4xl font-black tabular text-[var(--text-primary)] mb-1">95</div>
                <div className="text-sm font-semibold text-[var(--text-tertiary)]">Premium Seats</div>
              </div>
              
              {/* Stat 2: Hours */}
              <div className="bg-[var(--saffron-700)] text-white rounded-[1.5rem] p-6 flex flex-col shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/15 rounded-full blur-2xl group-hover:bg-white/20 transition-colors duration-500" />
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
                  <Sun className="w-6 h-6 text-white" />
                </div>
                <div className="text-4xl font-black tabular mb-1 text-white">6<span className="text-2xl font-bold opacity-80">am</span>-10<span className="text-2xl font-bold opacity-80">pm</span></div>
                <div className="text-sm font-semibold text-white/90">Open Daily</div>
              </div>
              
            </div>
          </div>
        </section>

        {/* ── Features Footer ── */}
        <section id="facilities" aria-label="Facilities" className="mt-16 lg:mt-24 animate-slide-up" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Premium Facilities</h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto leading-relaxed">Everything you need for an uninterrupted and highly productive study session.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
            {AMENITIES.map(({ name, desc, Icon }) => (
              <div key={name} className="group bg-white border border-[var(--border-default)] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm surface-lift cursor-default">
                <div className="w-14 h-14 rounded-2xl bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-secondary)] mb-5 transition-colors duration-300 group-hover:bg-[var(--saffron-50)] group-hover:text-[var(--saffron-600)]">
                  <Icon className="w-7 h-7" />
                </div>
                <div className="text-base font-bold text-[var(--text-primary)] mb-1.5">{name}</div>
                <div className="text-sm font-medium text-[var(--text-tertiary)] leading-snug">{desc}</div>
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
