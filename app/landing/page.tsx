'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/auth/AuthModal';
import {
  ArrowRight, MapPin, Phone, MessageCircle, Lock,
  Wind, Wifi, ShieldCheck, Droplets, Bike, VolumeX, Newspaper, UtensilsCrossed,
} from 'lucide-react';

const AMENITIES = [
  { name: 'Air Conditioned', desc: 'Optimal temperatures maintained year-round.', Icon: Wind },
  { name: 'Wi-Fi', desc: 'Seamless connectivity for uninterrupted study.', Icon: Wifi },
  { name: '24/7 Security', desc: 'Full CCTV coverage for peace of mind.', Icon: ShieldCheck },
  { name: 'Purified Water', desc: 'Chilled RO filtration system available.', Icon: Droplets },
  { name: 'Secure Parking', desc: 'Dedicated spaces for two-wheelers.', Icon: Bike },
  { name: 'Silent Zones', desc: 'Acoustically treated for deep focus.', Icon: VolumeX },
  { name: 'Current Affairs', desc: 'Daily newspapers and magazines.', Icon: Newspaper },
  { name: 'Dining Lounge', desc: 'Separate hygienic space for meals.', Icon: UtensilsCrossed },
];

const STATS = [
  { n: '95', l: 'Total seats' },
  { n: '2', l: 'Daily shifts' },
  { n: '6:00 AM', l: 'Opens daily' },
  { n: '10:00 PM', l: 'Closes daily' },
];

export default function LandingPage() {
  const router = useRouter();
  const { loginAsUser, isAuthenticated, isAdmin, isLoading } = useAuth();
  const [showStaffLogin, setShowStaffLogin] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace(isAdmin ? '/' : '/browse');
  }, [isAuthenticated, isAdmin, isLoading, router]);

  function handleStudentClick() {
    loginAsUser();
    router.push('/browse');
  }

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-[var(--text-primary)]">
      {/* Decorative jaali lattice — heritage motif, kept but light-tuned. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' stroke='%23A65310' stroke-opacity='0.13'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z' stroke-width='0.6'/%3E%3Cpath d='M30 12 L48 30 L30 48 L12 30 Z' stroke-width='0.4'/%3E%3Ccircle cx='30' cy='30' r='3.5' stroke-width='0.4'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-5 sm:px-8">

        {/* ── Header ── */}
        <header className="flex items-center justify-between gap-4 py-6">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="h-9 w-9 rotate-45 rounded-[6px] border-2 border-[var(--saffron-600)] bg-[var(--saffron-50)]"
            />
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                Shree Gangaur
              </p>
              <p className="text-[11px] font-medium text-[var(--text-tertiary)]">
                Kankroli · Rajsamand
              </p>
            </div>
          </div>

          {/* Staff login is now a real, keyboard-reachable control. It used to be
              a hidden triple-click on the logo — undiscoverable and impossible
              to reach without a mouse. */}
          <button
            type="button"
            onClick={() => setShowStaffLogin(true)}
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 text-[13px] font-semibold text-[var(--text-secondary)] shadow-[var(--shadow-xs)] transition-colors hover:border-[var(--saffron-600)] hover:text-[var(--saffron-700)]"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
            Staff login
          </button>
        </header>

        {/* ── Hero ── */}
        <main className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <div className="mb-6 flex items-center gap-3" aria-hidden="true">
            <span className="h-px w-10 bg-[var(--border-default)]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--saffron-700)]">
              Est. Rajsamand
            </span>
            <span className="h-px w-10 bg-[var(--border-default)]" />
          </div>

          <h1
            className="text-4xl leading-tight text-[var(--text-primary)] sm:text-5xl"
            style={{ fontFamily: 'var(--font-devanagari)' }}
          >
            श्री गणगौर
          </h1>
          <p
            className="mt-3 text-xl font-medium text-[var(--saffron-700)] sm:text-2xl"
            style={{ fontFamily: 'var(--font-serif-display)' }}
          >
            Shree Gangaur Study Library
          </p>

          <div className="my-7 flex items-center gap-2" aria-hidden="true">
            <span className="h-px w-14 bg-gradient-to-r from-transparent to-[var(--saffron-300)]" />
            <span className="h-1.5 w-1.5 rotate-45 bg-[var(--saffron-500)]" />
            <span className="h-2.5 w-2.5 rotate-45 bg-[var(--saffron-600)]" />
            <span className="h-1.5 w-1.5 rotate-45 bg-[var(--saffron-500)]" />
            <span className="h-px w-14 bg-gradient-to-l from-transparent to-[var(--saffron-300)]" />
          </div>

          <p className="max-w-md text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Rajsamand&apos;s sanctuary for{' '}
            <em className="font-semibold not-italic text-[var(--text-primary)]">deep work</em> and{' '}
            <em className="font-semibold not-italic text-[var(--text-primary)]">academic mastery</em>
            {' '}— where tradition meets discipline.
          </p>

          {/* ── Student CTA ── */}
          <button
            type="button"
            onClick={handleStudentClick}
            className="group mt-9 w-full max-w-md cursor-pointer rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 text-left shadow-[var(--shadow-sm)] transition-ui hover:-translate-y-0.5 hover:border-[var(--saffron-600)] hover:shadow-[var(--shadow-md)]"
          >
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--saffron-700)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--emerald-500)]" aria-hidden="true" />
              Student access
            </span>
            <span className="mt-3 flex items-center justify-between gap-4">
              <span>
                <span className="block text-lg font-semibold text-[var(--text-primary)]">
                  Enter Library Portal
                </span>
                <span className="mt-1 block text-[13px] text-[var(--text-secondary)]">
                  Browse available seats &amp; submit a request
                </span>
              </span>
              <ArrowRight
                className="h-5 w-5 shrink-0 text-[var(--saffron-600)] transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </button>

          {/* ── Stats ── */}
          <dl className="mt-10 grid w-full max-w-md grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--border-default)] sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.l} className="bg-[var(--bg-surface)] px-3 py-4 text-center">
                <dt className="sr-only">{s.l}</dt>
                <dd>
                  <span className="block text-base font-bold text-[var(--text-primary)]">{s.n}</span>
                  <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    {s.l}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          {/* ── Amenities ── */}
          <section className="mt-12 w-full border-t border-[var(--border-default)] pt-10">
            <h2 className="sr-only">Library amenities</h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4">
              {AMENITIES.map(({ name, desc, Icon }) => (
                <li key={name} className="flex flex-col items-center gap-2.5 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--saffron-200)] bg-[var(--saffron-50)]">
                    <Icon className="h-5 w-5 text-[var(--saffron-700)]" aria-hidden="true" />
                  </span>
                  <span className="text-[12px] font-bold text-[var(--text-primary)]">{name}</span>
                  <span className="text-[11px] leading-snug text-[var(--text-tertiary)]">{desc}</span>
                </li>
              ))}
            </ul>
          </section>
        </main>

        {/* ── Footer ── */}
        <footer className="mt-12 flex flex-col items-center gap-4 border-t border-[var(--border-default)] py-7 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
            <MapPin className="h-4 w-4 shrink-0 text-[var(--saffron-600)]" aria-hidden="true" />
            Opp. Maniratna Restaurant, JK Circle, Kankroli
          </p>

          <div className="flex items-center gap-5">
            <a
              href="https://wa.me/919462672576"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--saffron-700)]"
            >
              <MessageCircle className="h-4 w-4 text-[var(--saffron-600)]" aria-hidden="true" />
              <span className="sr-only">WhatsApp: </span>94626 72576
            </a>
            <a
              href="tel:+919829230576"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--saffron-700)]"
            >
              <Phone className="h-4 w-4 text-[var(--saffron-600)]" aria-hidden="true" />
              <span className="sr-only">Phone: </span>98292 30576
            </a>
          </div>

          <p className="text-[11px] text-[var(--text-tertiary)]">© 2026 Gangaur</p>
        </footer>
      </div>

      <AuthModal open={showStaffLogin} onClose={() => setShowStaffLogin(false)} />
    </div>
  );
}
