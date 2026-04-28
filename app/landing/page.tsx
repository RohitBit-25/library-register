'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LandingPage() {
  const router = useRouter();
  const { loginAsAdmin, loginAsUser, isAuthenticated, isAdmin } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) router.replace(isAdmin ? '/' : '/browse');
  }, [isAuthenticated, isAdmin, router]);

  if (isAuthenticated) return null;

  function handleStudentClick() {
    loginAsUser();
    router.push('/browse');
  }

  /* Hidden admin: triple-click on logo gem */
  function handleLogoTap() {
    const next = tapCount + 1;
    if (next >= 3) {
      setShowAdmin(true);
      setTapCount(0);
    } else {
      setTapCount(next);
      setTimeout(() => setTapCount(0), 1200);
    }
  }

  async function handlePinSubmit(val: string) {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPin(clean);
    setPinError(false);
    if (clean.length === 6) {
      const success = await loginAsAdmin(clean);
      if (success) {
        router.push('/');
      } else {
        setPinError(true);
        setTimeout(() => { setPin(''); setPinError(false); }, 1100);
      }
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .lp-root {
          font-family: 'DM Sans', sans-serif;
          background: #080604;
          color: #ede0ca;
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          width: 100%;
        }

        /* ── Background layers ── */
        .lp-jaal {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          animation: jaal-breathe 10s ease-in-out infinite;
        }
        @keyframes jaal-breathe {
          0%, 100% { opacity: 0.038; }
          50%       { opacity: 0.055; }
        }

        .lp-orb1 {
          position: absolute;
          top: -8%; right: -12%;
          width: 62%; height: 62%;
          border-radius: 50%;
          background: radial-gradient(circle at 40% 40%, rgba(176,95,8,0.28) 0%, rgba(120,55,6,0.14) 40%, transparent 70%);
          pointer-events: none;
          animation: orb-pulse 12s ease-in-out infinite;
        }
        @keyframes orb-pulse {
          0%, 100% { opacity: 0.28; }
          50%       { opacity: 0.35; }
        }
        .lp-orb2 {
          position: absolute;
          bottom: -20%; left: -8%;
          width: 58%; height: 58%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(100,45,4,0.22) 0%, transparent 65%);
          pointer-events: none;
        }
        .lp-orb3 {
          position: absolute;
          top: 48%; left: 38%;
          width: 36%; height: 36%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(160,88,8,0.09) 0%, transparent 70%);
          pointer-events: none;
        }
        .lp-vign {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 80% at 50% 50%, transparent 20%, rgba(4,2,1,0.75) 100%);
          pointer-events: none;
        }
        .lp-vign2 {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(4,2,1,0.5) 0%, transparent 20%, transparent 75%, rgba(4,2,1,0.8) 100%);
          pointer-events: none;
        }

        /* ── Frame ── */
        .lp-frame {
          position: absolute; inset: 14px;
          pointer-events: none;
        }
        .lp-frame-border {
          position: absolute; inset: 0;
          border: 0.5px solid rgba(185,118,14,0.16);
        }
        .lp-frame-border2 {
          position: absolute; inset: 6px;
          border: 0.5px solid rgba(185,118,14,0.07);
        }
        .lp-top-rule {
          position: absolute; top: 0;
          left: 52px; right: 52px; height: 0.5px;
          background: linear-gradient(to right, transparent, rgba(185,118,14,0.3) 20%, rgba(185,118,14,0.3) 80%, transparent);
        }
        .lp-bot-rule {
          position: absolute; bottom: 0;
          left: 52px; right: 52px; height: 0.5px;
          background: linear-gradient(to right, transparent, rgba(185,118,14,0.3) 20%, rgba(185,118,14,0.3) 80%, transparent);
        }

        /* ── Corner markers ── */
        .lp-corner { position: absolute; width: 52px; height: 52px; }
        .lp-corner svg { width: 100%; height: 100%; }
        .lp-c-tl { top: 0; left: 0; }
        .lp-c-tr { top: 0; right: 0; transform: scaleX(-1); }
        .lp-c-bl { bottom: 0; left: 0; transform: scaleY(-1); }
        .lp-c-br { bottom: 0; right: 0; transform: scale(-1, -1); }

        /* ── Page layout ── */
        .lp-page {
          position: relative; z-index: 5;
          display: flex; flex-direction: column;
          min-height: 100vh;
        }

        /* ── Header ── */
        .lp-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 26px 44px;
        }
        .lp-logo { display: flex; align-items: center; gap: 13px; }
        .lp-logo-gem { position: relative; width: 36px; height: 36px; flex-shrink: 0; }
        .lp-gem-outer {
          position: absolute; inset: 0;
          border: 0.75px solid rgba(185,118,14,0.55);
          transform: rotate(45deg);
        }
        .lp-gem-inner {
          position: absolute; inset: 8px;
          border: 0.5px solid rgba(185,118,14,0.3);
          transform: rotate(45deg);
        }
        .lp-gem-dot {
          position: absolute; inset: 14px;
          background: #b8760e;
          transform: rotate(45deg);
        }
        .lp-logo-name {
          font-size: 10px;
          letter-spacing: 0.38em;
          text-transform: uppercase;
          color: #b8760e;
          font-weight: 500;
          display: block;
        }
        .lp-logo-place {
          font-size: 9px;
          letter-spacing: 0.2em;
          color: rgba(237,224,202,0.28);
          display: block;
          margin-top: 2px;
        }
        .lp-nav { display: flex; align-items: center; gap: 10px; }
        .lp-nav-item {
          font-size: 9px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: rgba(237,224,202,0.28);
          font-weight: 500;
        }
        .lp-nav-gem {
          width: 4px; height: 4px;
          background: rgba(185,118,14,0.45);
          transform: rotate(45deg);
        }

        /* ── Hero ── */
        .lp-hero {
          flex: 1;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 0 44px 24px;
          text-align: center;
        }

        .lp-eyebrow { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .lp-ey-line-l { width: 48px; height: 0.5px; background: linear-gradient(to right, transparent, rgba(185,118,14,0.6)); }
        .lp-ey-line-r { width: 48px; height: 0.5px; background: linear-gradient(to left, transparent, rgba(185,118,14,0.6)); }
        .lp-ey-label {
          font-size: 9px; letter-spacing: 0.42em;
          text-transform: uppercase;
          color: rgba(185,118,14,0.7); font-weight: 500;
        }

        .lp-title-hi {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(48px, 10vw, 80px);
          font-weight: 600;
          line-height: 1.35;
          letter-spacing: 0.02em;
          padding: 8px 4px 12px;
          background: linear-gradient(170deg, #f7ecd9 0%, #e8d0a8 38%, #c9980e 68%, #8b610a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lp-title-en {
          font-family: 'Cormorant Garamond', serif;
          font-size: 12px;
          letter-spacing: 0.44em;
          text-transform: uppercase;
          color: rgba(185,130,40,0.45);
          font-style: italic;
          margin-top: 4px;
        }

        /* ── Ornament divider ── */
        .lp-orn { display: flex; align-items: center; margin: 18px 0 22px; width: 320px; }
        .lp-orn-l { flex: 1; height: 0.5px; background: linear-gradient(to right, transparent, rgba(185,118,14,0.45)); }
        .lp-orn-r { flex: 1; height: 0.5px; background: linear-gradient(to left, transparent, rgba(185,118,14,0.45)); }
        .lp-orn-mid { display: flex; align-items: center; gap: 5px; padding: 0 14px; }
        .lp-orn-d    { width: 5px; height: 5px; background: #b8760e; transform: rotate(45deg); }
        .lp-orn-ds   { width: 3px; height: 3px; background: rgba(185,118,14,0.5); transform: rotate(45deg); }
        .lp-orn-xs   { width: 2px; height: 2px; background: rgba(185,118,14,0.3); transform: rotate(45deg); }

        .lp-tagline {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px; font-style: italic;
          color: rgba(237,224,202,0.45);
          letter-spacing: 0.06em;
          line-height: 1.75;
          max-width: 400px;
          margin-bottom: 40px;
          font-weight: 300;
        }
        .lp-tagline em { color: rgba(210,170,85,0.85); font-style: normal; }

        /* ── CTA cards ── */
        .lp-cards {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          width: 100%;
          max-width: 420px;
          margin-bottom: 40px;
        }
        .lp-card {
          border: 0.5px solid rgba(185,118,14,0.2);
          padding: 26px 26px 22px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          text-align: left;
          background: rgba(8,6,4,0.55);
          transition: border-color 0.25s, background 0.25s;
        }
        .lp-card:hover { border-color: rgba(185,118,14,0.5); background: rgba(185,118,14,0.05); }
        .lp-card:active { transform: scale(0.99); }
        .lp-card-bar {
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(to right, transparent, rgba(185,118,14,0.6), transparent);
          opacity: 0; transition: opacity 0.25s;
        }
        .lp-card:hover .lp-card-bar { opacity: 1; }

        .lp-card-role {
          font-size: 9px; letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(185,118,14,0.55); font-weight: 500;
          display: flex; align-items: center; gap: 7px;
          margin-bottom: 12px;
        }
        .lp-role-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #b8760e;
          flex-shrink: 0;
        }
        .lp-role-dot-dim { background: rgba(237,224,202,0.2); }
        .lp-card-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 600;
          color: #f0e2c8;
          margin-bottom: 5px; line-height: 1.2;
        }
        .lp-card-sub {
          font-size: 11px; color: rgba(237,224,202,0.3);
          letter-spacing: 0.06em; line-height: 1.5;
        }
        .lp-card-arrow {
          position: absolute; bottom: 20px; right: 22px;
          width: 30px; height: 30px;
          border: 0.5px solid rgba(185,118,14,0.2);
          display: flex; align-items: center; justify-content: center;
          transition: border-color 0.2s, background 0.2s;
        }
        .lp-card:hover .lp-card-arrow {
          border-color: rgba(185,118,14,0.55);
          background: rgba(185,118,14,0.1);
        }

        /* ── Hidden admin overlay ── */
        .lp-admin-overlay {
          position: fixed; inset: 0; z-index: 999;
          background: rgba(4,2,1,0.92);
          display: flex; align-items: center; justify-content: center;
          animation: lp-fade-in 0.3s ease-out;
        }
        @keyframes lp-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .lp-admin-box {
          width: 340px; padding: 36px 32px;
          border: 0.5px solid rgba(185,118,14,0.25);
          background: rgba(8,6,4,0.95);
          text-align: center; position: relative;
        }
        .lp-admin-close {
          position: absolute; top: 10px; right: 14px;
          background: none; border: none; color: rgba(237,224,202,0.3);
          font-size: 18px; cursor: pointer; padding: 4px;
        }
        .lp-admin-close:hover { color: rgba(237,224,202,0.6); }
        .lp-admin-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; font-weight: 600; color: #f0e2c8;
          margin-bottom: 6px;
        }
        .lp-admin-sub {
          font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(237,224,202,0.25); margin-bottom: 24px;
        }
        .lp-pin-input {
          width: 100%; background: transparent;
          border: none; border-bottom: 0.5px solid rgba(237,224,202,0.12);
          color: #c4891a;
          font-size: 22px; letter-spacing: 0.55em;
          font-family: 'DM Sans', sans-serif;
          outline: none; padding: 4px 0 8px;
          transition: border-color 0.2s; caret-color: #b8760e;
          text-align: center;
        }
        .lp-pin-input:focus { border-bottom-color: rgba(185,118,14,0.55); }
        .lp-pin-input::placeholder {
          color: rgba(237,224,202,0.12);
          letter-spacing: 0.18em; font-size: 14px;
        }
        .lp-pin-error {
          font-size: 9px; color: #b05050;
          letter-spacing: 0.18em; text-transform: uppercase;
          margin-top: 10px; height: 14px;
          transition: opacity 0.2s; opacity: 0;
        }
        .lp-pin-error.show { opacity: 1; }

        /* ── Stats ── */
        .lp-stats { display: flex; align-items: center; margin-bottom: 10px; }
        .lp-stat { text-align: center; padding: 0 28px; }
        .lp-stat-n {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 600;
          color: #b8760e; line-height: 1;
        }
        .lp-stat-l {
          font-size: 9px; letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(237,224,202,0.22);
          margin-top: 4px;
        }
        .lp-stat-sep { width: 0.5px; height: 36px; background: rgba(185,118,14,0.18); }

        /* ── Footer ── */
        .lp-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 44px 26px;
          border-top: 0.5px solid rgba(185,118,14,0.1);
        }
        .lp-footer-loc {
          display: flex; align-items: center; gap: 7px;
          font-size: 9px; letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(237,224,202,0.2);
        }
        .lp-footer-links { display: flex; gap: 18px; align-items: center; }
        .lp-footer-link {
          font-size: 9px; letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(237,224,202,0.18);
          cursor: pointer;
          transition: color 0.15s;
          text-decoration: none;
        }
        .lp-footer-link:hover { color: rgba(185,118,14,0.65); }
        .lp-footer-sep { width: 0.5px; height: 12px; background: rgba(237,224,202,0.1); }
        .lp-footer-copy {
          font-size: 9px; letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(237,224,202,0.1);
        }

        /* ═══ RESPONSIVE ═══ */
        @media (max-width: 768px) {
          .lp-header { padding: 18px 20px; }
          .lp-nav { display: none; }
          .lp-hero { padding: 0 20px 20px; }
          .lp-title-hi { font-size: clamp(40px, 12vw, 60px); }
          .lp-title-en { font-size: 10px; letter-spacing: 0.3em; }
          .lp-orn { width: 240px; }
          .lp-tagline { font-size: 14px; max-width: 320px; margin-bottom: 28px; }
          .lp-cards { max-width: 100%; }
          .lp-stats { flex-wrap: wrap; gap: 12px; justify-content: center; }
          .lp-stat { padding: 0 16px; }
          .lp-stat-sep { display: none; }
          .lp-stat-n { font-size: 22px; }
          .lp-footer { flex-direction: column; gap: 12px; align-items: center; padding: 14px 20px 20px; }
          .lp-footer-links { gap: 12px; }
          .lp-frame { inset: 8px; }
          .lp-corner { width: 36px; height: 36px; }
          .lp-top-rule, .lp-bot-rule { left: 36px; right: 36px; }
          .lp-admin-box { width: 90vw; max-width: 340px; padding: 28px 22px; }
        }
        @media (max-width: 480px) {
          .lp-header { padding: 14px 16px; }
          .lp-logo-name { font-size: 9px; letter-spacing: 0.28em; }
          .lp-logo-place { font-size: 8px; }
          .lp-logo-gem { width: 30px; height: 30px; }
          .lp-gem-inner { inset: 6px; }
          .lp-gem-dot { inset: 11px; }
          .lp-hero { padding: 0 14px 16px; }
          .lp-eyebrow { gap: 8px; margin-bottom: 14px; }
          .lp-ey-line-l, .lp-ey-line-r { width: 28px; }
          .lp-ey-label { font-size: 8px; }
          .lp-title-hi { font-size: clamp(36px, 14vw, 50px); padding: 6px 2px 10px; }
          .lp-title-en { font-size: 9px; letter-spacing: 0.22em; }
          .lp-orn { width: 200px; margin: 12px 0 16px; }
          .lp-tagline { font-size: 13px; max-width: 280px; margin-bottom: 22px; line-height: 1.6; }
          .lp-card { padding: 20px 20px 18px; }
          .lp-card-title { font-size: 18px; }
          .lp-card-sub { font-size: 10px; }
          .lp-card-arrow { width: 26px; height: 26px; bottom: 16px; right: 18px; }
          .lp-stat { padding: 0 12px; }
          .lp-stat-n { font-size: 20px; }
          .lp-stat-l { font-size: 8px; }
          .lp-footer-loc { font-size: 8px; }
          .lp-footer-link { font-size: 8px; }
          .lp-footer-copy { font-size: 8px; }
          .lp-frame { inset: 6px; }
          .lp-corner { width: 28px; height: 28px; }
          .lp-top-rule, .lp-bot-rule { left: 28px; right: 28px; }
        }
      `}</style>

      <div className="lp-root">

        {/* ── Background ── */}
        <svg className="lp-jaal" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="jp" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="none" stroke="#b8760e" strokeWidth="0.5" />
              <path d="M30 10 L50 30 L30 50 L10 30 Z" fill="none" stroke="#b8760e" strokeWidth="0.35" />
              <path d="M30 18 L42 30 L30 42 L18 30 Z" fill="none" stroke="#b8760e" strokeWidth="0.2" />
              <circle cx="30" cy="30" r="3.5" fill="none" stroke="#b8760e" strokeWidth="0.35" />
              <circle cx="30" cy="30" r="1.2" fill="#b8760e" fillOpacity="0.4" />
              <circle cx="0" cy="0" r="1.8" fill="#b8760e" fillOpacity="0.5" />
              <circle cx="60" cy="0" r="1.8" fill="#b8760e" fillOpacity="0.5" />
              <circle cx="0" cy="60" r="1.8" fill="#b8760e" fillOpacity="0.5" />
              <circle cx="60" cy="60" r="1.8" fill="#b8760e" fillOpacity="0.5" />
              <circle cx="30" cy="0" r="1.2" fill="#b8760e" fillOpacity="0.3" />
              <circle cx="30" cy="60" r="1.2" fill="#b8760e" fillOpacity="0.3" />
              <circle cx="0" cy="30" r="1.2" fill="#b8760e" fillOpacity="0.3" />
              <circle cx="60" cy="30" r="1.2" fill="#b8760e" fillOpacity="0.3" />
              <path d="M30 0 L30 10 M30 50 L30 60 M0 30 L10 30 M50 30 L60 30"
                stroke="#b8760e" strokeWidth="0.25" strokeOpacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#jp)" />
        </svg>

        <div className="lp-orb1" />
        <div className="lp-orb2" />
        <div className="lp-orb3" />
        <div className="lp-vign" />
        <div className="lp-vign2" />

        {/* ── Frame ── */}
        <div className="lp-frame">
          <div className="lp-frame-border" />
          <div className="lp-frame-border2" />
          <div className="lp-top-rule" />
          <div className="lp-bot-rule" />

          {/* Corner SVG — reused for all 4 via CSS transforms */}
          {(['lp-c-tl', 'lp-c-tr', 'lp-c-bl', 'lp-c-br'] as const).map((cls) => (
            <div key={cls} className={`lp-corner ${cls}`}>
              <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 50 L2 14 Q2 2 14 2 L50 2" stroke="rgba(185,118,14,0.6)" strokeWidth="0.75" />
                <path d="M2 28 L12 28" stroke="rgba(185,118,14,0.3)" strokeWidth="0.5" />
                <path d="M28 2 L28 12" stroke="rgba(185,118,14,0.3)" strokeWidth="0.5" />
                <circle cx="2" cy="2" r="2.5" fill="#b8760e" fillOpacity="0.7" />
                <rect x="9" y="9" width="7" height="7"
                  transform="rotate(45 12.5 12.5)"
                  fill="none" stroke="rgba(185,118,14,0.5)" strokeWidth="0.5" />
                <rect x="11.5" y="11.5" width="2" height="2"
                  transform="rotate(45 12.5 12.5)"
                  fill="#b8760e" fillOpacity="0.5" />
              </svg>
            </div>
          ))}
        </div>

        {/* ── Page ── */}
        <div className="lp-page">

          {/* Header */}
          <header className="lp-header">
            <div className="lp-logo">
              <div className="lp-logo-gem" onClick={handleLogoTap} style={{ cursor: 'pointer' }}>
                <div className="lp-gem-outer" />
                <div className="lp-gem-inner" />
                <div className="lp-gem-dot" />
              </div>
              <div>
                <span className="lp-logo-name">Shree Gangaur</span>
                <span className="lp-logo-place">Kankroli · Rajsamand</span>
              </div>
            </div>
            <nav className="lp-nav" aria-label="Site pillars">
              <span className="lp-nav-item">Focus</span>
              <div className="lp-nav-gem" />
              <span className="lp-nav-item">Silence</span>
              <div className="lp-nav-gem" />
              <span className="lp-nav-item">Mastery</span>
            </nav>
          </header>

          {/* Hero */}
          <main className="lp-hero">

            {/* Eyebrow */}
            <div className="lp-eyebrow" aria-hidden="true">
              <div className="lp-ey-line-l" />
              <span className="lp-ey-label">Est. Rajsamand</span>
              <div className="lp-ey-line-r" />
            </div>

            {/* Title */}
            <div>
              <h1 className="lp-title-hi">श्री गणगौर</h1>
              <p className="lp-title-en">Shree Gangaur Study Library</p>
            </div>

            {/* Ornament */}
            <div className="lp-orn" aria-hidden="true">
              <div className="lp-orn-l" />
              <div className="lp-orn-mid">
                <div className="lp-orn-xs" />
                <div className="lp-orn-ds" />
                <div className="lp-orn-d" />
                <div className="lp-orn-ds" />
                <div className="lp-orn-xs" />
              </div>
              <div className="lp-orn-r" />
            </div>

            {/* Tagline */}
            <p className="lp-tagline">
              Rajsamand&apos;s sanctuary for <em>deep work</em> and <em>academic mastery</em> —<br />
              where tradition meets discipline.
            </p>

            {/* CTA — Student Only */}
            <div className="lp-cards">
              <div
                className="lp-card"
                role="button"
                tabIndex={0}
                aria-label="Enter as student"
                onClick={handleStudentClick}
                onKeyDown={(e) => e.key === 'Enter' && handleStudentClick()}
                style={{ width: '100%' }}
              >
                <div className="lp-card-bar" aria-hidden="true" />
                <div className="lp-card-role">
                  <div className="lp-role-dot" />
                  Student access
                </div>
                <div className="lp-card-title">Enter Library Portal</div>
                <div className="lp-card-sub">Browse available seats &amp; submit a request</div>
                <div className="lp-card-arrow" aria-hidden="true">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"
                    stroke="rgba(185,118,14,0.65)" strokeWidth="1.5">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="lp-stats" aria-label="Library at a glance">
              {[
                { n: '86', l: 'Total seats' },
                { n: '2', l: 'Daily shifts' },
                { n: '6 AM', l: 'Opens daily' },
                { n: '10 PM', l: 'Closes daily' },
              ].map((s, i, arr) => (
                <span key={s.l} style={{ display: 'contents' }}>
                  <div className="lp-stat">
                    <div className="lp-stat-n">{s.n}</div>
                    <div className="lp-stat-l">{s.l}</div>
                  </div>
                  {i < arr.length - 1 && <div className="lp-stat-sep" aria-hidden="true" />}
                </span>
              ))}
            </div>

          </main>

          {/* Footer */}
          <footer className="lp-footer">
            <div className="lp-footer-loc">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none"
                stroke="#b8760e" strokeWidth="1.5" aria-hidden="true">
                <path d="M8 14s-5-5-5-8a5 5 0 0 1 10 0c0 3-5 8-5 8z" />
                <circle cx="8" cy="6" r="1.5" />
              </svg>
              Kankroli, Rajsamand
            </div>
            <div className="lp-footer-links">
              <a href="#" className="lp-footer-link">Rules &amp; conduct</a>
              <div className="lp-footer-sep" aria-hidden="true" />
              <a href="#" className="lp-footer-link">Timetable</a>
              <div className="lp-footer-sep" aria-hidden="true" />
              <a href="#" className="lp-footer-link">Contact</a>
            </div>
            <div className="lp-footer-copy">© 2026 Gangaur</div>
          </footer>

        </div>
      </div>

      {/* Hidden Admin Overlay — triggered by triple-clicking logo */}
      {showAdmin && (
        <div className="lp-admin-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowAdmin(false); setPin(''); setPinError(false); } }}>
          <div className="lp-admin-box">
            <button className="lp-admin-close" onClick={() => { setShowAdmin(false); setPin(''); setPinError(false); }} aria-label="Close">&times;</button>
            <div className="lp-admin-title">Admin Access</div>
            <div className="lp-admin-sub">Enter 6-digit PIN</div>
            <input
              className="lp-pin-input"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              placeholder="••••••"
              autoComplete="off"
              autoFocus
              aria-label="Admin PIN"
              onChange={(e) => handlePinSubmit(e.target.value)}
              style={{ borderBottomColor: pinError ? 'rgba(180,70,70,0.55)' : undefined }}
            />
            <div className={`lp-pin-error${pinError ? ' show' : ''}`} role="alert">Incorrect PIN</div>
          </div>
        </div>
      )}
    </>
  );
}