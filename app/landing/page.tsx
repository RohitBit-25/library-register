'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useMembers } from '@/hooks/useMembers';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import { Button } from '@/components/ui/Button';
import { 
  ArrowRight, Sun, ShieldCheck, Droplets, VolumeX, Wind, Wifi, Armchair, CalendarDays
} from 'lucide-react';

/**
 * Reveals its children the first time they scroll into view.
 *
 * The page previously fired every section's `animate-slide-up` on load with
 * hardcoded delays up to 600ms. On a 900px viewport that means the amenities
 * grid — a full screen below the fold — finishes animating about half a second
 * after load, long before anyone scrolls to it. The motion was spent on an
 * empty viewport, so the section a visitor actually arrives at simply sits
 * there. Reveal on intersection instead, which is what the delays were reaching
 * for.
 *
 * One-shot: `unobserve` after the first trigger, so scrolling back up does not
 * replay it. Re-animating content someone has already read is noise.
 *
 * No reduced-motion branch here — globals.css collapses every animation to
 * 0.01ms under `prefers-reduced-motion`, so the class still applies and the
 * content simply appears.
 */
function Reveal({ children, delay = 0, className = '' }: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No "already visible at mount" short-circuit: IntersectionObserver
    // already invokes its callback once on observe with the current state, so
    // anything on screen reveals on the next frame anyway. Setting state
    // synchronously here instead is what the React Compiler flags as a
    // cascading render, and it would be duplicating the observer's own job.
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setShown(true);
      io.unobserve(el);
    }, { rootMargin: '0px 0px -12% 0px' });
    io.observe(el);

    // Safety net, and the timing is the whole point of it. Hiding content
    // until an observer says otherwise means that if the observer never
    // fires, the section is invisible rather than merely un-animated — and
    // "the page is blank below the hero" is a far worse failure than "the
    // animation did not play". Caught in review by a full-page screenshot,
    // which renders without scrolling and came out empty.
    //
    // Four seconds, not one: a short timer defeats the very reveal it is
    // protecting, firing before anyone has scrolled and putting the motion
    // back on an empty viewport. Long enough that ordinary scrolling wins the
    // race, short enough that a genuinely broken observer self-corrects.
    const failsafe = setTimeout(() => setShown(true), 4000);
    return () => { io.disconnect(); clearTimeout(failsafe); };
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${shown ? 'animate-slide-up' : 'opacity-0'}`}
      style={shown ? { animationDelay: `${delay}ms`, animationFillMode: 'both' } : undefined}
    >
      {children}
    </div>
  );
}

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
        {/* Was pt-32 on a large screen, which pushed the CTA to ~740px and the
            banner — the one real photograph of the place — entirely below the
            fold. Tightened so the banner peeks above it and invites the scroll. */}
        <section className="max-w-4xl mx-auto w-full px-4 pt-10 md:pt-14 lg:pt-16 pb-10 flex flex-col items-center text-center">
          <div className="animate-slide-up" style={{ animationFillMode: 'both' }}>
            <div className="inline-flex items-center gap-2 bg-[var(--saffron-50)] text-[var(--saffron-700)] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8 border border-[var(--saffron-200)] shadow-sm">
              {/* A static dot. This pulsed forever beside the words "Premium
                  Study Space" — a live indicator on a label that never
                  changes. The pulse is reserved for the free-seat count, where
                  it means something. */}
              <span className="inline-flex h-2 w-2 rounded-full bg-[var(--saffron-500)]" aria-hidden="true" />
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
            {/* These were raw <button>s: `transition-all` (which animates every
                property, including ones that trigger layout) and no press
                state at all — the two most important controls on the public
                site did not acknowledge being pressed. Routed through the
                shared Button, which carries `whileTap`, the 44px minimum
                target and the focus ring. The overrides keep the hero's own
                scale and weight; only the behaviour changed. */}
            <Button
              onClick={() => router.push('/browse')}
              size="lg"
              className="w-full gap-3 rounded-xl border-[var(--saffron-800)] bg-[var(--saffron-700)] text-lg font-bold shadow-lg hover:bg-[var(--saffron-800)] hover:shadow-xl sm:w-auto"
            >
              Check Seat Availability
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => document.getElementById('facilities')?.scrollIntoView({ behavior: 'smooth' })}
              size="lg"
              className="w-full rounded-xl border-[var(--border-default)] bg-white text-lg font-bold text-[var(--text-primary)] shadow-sm hover:bg-[var(--bg-muted)] hover:shadow-md sm:w-auto"
            >
              Explore Facilities
            </Button>
          </div>

          {/* The single most useful fact on the page, and it was buried two
              screens down in a stats card. Someone landing here wants to know
              whether they can get a seat today. */}
          <p
            className="animate-slide-up mt-6 flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]"
            style={{ animationDelay: '380ms', animationFillMode: 'both' }}
            aria-live="polite"
          >
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--emerald-400)] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--emerald-500)]" />
            </span>
            {stats.total === 0
              ? 'Checking seat availability…'
              : stats.vacant > 0
                ? <><span className="tabular font-bold text-[var(--emerald-700)]">{stats.vacant}</span> of {stats.total} seats free right now</>
                : <>All {stats.total} seats are taken — join the waitlist</>}
          </p>
        </section>

        {/* ── Banner Image Showcase ── */}
        <Reveal className="max-w-[1440px] mx-auto w-full px-4 md:px-6 lg:px-8 mb-20">
        <section>
          <div className="w-full relative rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl border border-[var(--border-default)] bg-[var(--bg-muted)] flex items-center justify-center">
            <img 
              src="/banner.png" 
              alt="Shree Gangaur Library Banner" 
              className="w-full h-auto object-contain"
            />
          </div>
        </section>
        </Reveal>

        {/* ── Quick Stats Grid ── */}
        <Reveal className="max-w-[1440px] mx-auto w-full px-4 md:px-6 lg:px-8 mb-24">
        <section>
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
            
            <div className="bg-[var(--emerald-50)] border-2 border-[var(--emerald-200)] rounded-2xl p-8 flex items-center gap-6 shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shrink-0 border border-[var(--emerald-200)]">
                <Armchair className="w-7 h-7 text-[var(--emerald-600)]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-black text-[var(--emerald-700)] mb-1">{stats.vacant || '--'}</div>
                  {/* Static: the hero already carries the live pulse for this
                      exact number, and two of them competing reads as decoration
                      rather than signal. */}
                  <span className="inline-flex h-3 w-3 rounded-full bg-[var(--emerald-500)]" aria-hidden="true" />
                </div>
                <div className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Available Now</div>
              </div>
            </div>

            {/* This card used to be the loud brown one, and it fetched its
                texture from transparenttextures.com — a third-party request on
                the first page a visitor sees, which can hang or fail and leaks
                the visit to another host. The app has its own `noise-pattern`.
                Opening hours also never change, so the emphasis moved to the
                free-seat count, which is the reason anyone clicks anything. */}
            <div className="bg-white border border-[var(--border-default)] rounded-2xl p-8 flex items-center gap-6 shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-[var(--saffron-50)] flex items-center justify-center shrink-0">
                <Sun className="w-7 h-7 text-[var(--saffron-700)]" />
              </div>
              <div>
                <div className="text-3xl font-black text-[var(--text-primary)] mb-1">6<span className="text-xl font-bold text-[var(--text-secondary)]">am</span>–10<span className="text-xl font-bold text-[var(--text-secondary)]">pm</span></div>
                <div className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Open Daily</div>
              </div>
            </div>
          </div>
        </section>
        </Reveal>

        {/* ── Facilities ── */}
        <Reveal className="max-w-[1440px] mx-auto w-full px-4 md:px-6 lg:px-8">
        <section id="facilities">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Premium Amenities</h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">Everything you need for an uninterrupted and highly productive study session.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
            {AMENITIES.map(({ name, desc, Icon }, i) => (
              <div
                key={name}
                /* 45ms apart: inside the 30–80ms band where a row still reads
                   as one movement rather than five things taking turns. */
                className="group bg-white border border-[var(--border-default)] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm animate-slide-up"
                style={{ animationDelay: `${i * 45}ms`, animationFillMode: 'both' }}
              >
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-secondary)] mb-5 group-hover:bg-[var(--saffron-50)] group-hover:text-[var(--saffron-600)] transition-colors duration-300">
                  <Icon className="w-8 h-8" />
                </div>
                <div className="text-base font-bold text-[var(--text-primary)] mb-1">{name}</div>
                <div className="text-sm font-medium text-[var(--text-secondary)]">{desc}</div>
              </div>
            ))}
          </div>
        </section>
        </Reveal>

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
