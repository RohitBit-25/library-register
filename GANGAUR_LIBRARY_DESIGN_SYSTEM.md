# श्री गणगौर Library — Complete Design System
### *Heritage Modernism · Udaipur, Rajasthan*

> **Design Philosophy:** "हवेली meets HIG" — The warmth of Rajasthani carved stone, marigold markets, and lake reflections, fused with precision-engineered modern interface craft. Every pixel should feel like it belongs to this place, this story.

---

## 0. The Concept — Why This Design Direction

The existing spec borrowed Apple HIG glass aesthetics without rooting them in identity. That's the trap. This system starts from the **source material**:

- The logo uses **multi-color Sanskrit/Devanagari** text on a **dark warm-brown background** with a **hand-painted brushstroke** — that IS the brand DNA
- Udaipur = City of Lakes = **reflections, depth, layered light on water**
- Rajasthani architecture = **Jaali screens (geometric lattice), carved havelis, warm sandstone textures**
- Festival culture = **vivid, unapologetic color** — not muted pastel, not corporate grey

The design language: **Warm Dark + Saturated Jewel Accents + Heritage Geometry**. Think a hand-carved stone library that glows from within.

---

## 1. Color System — The Full Token Architecture

### 1.1 Background Palette (Warm Dark Foundation)

```css
/* globals.css */
:root {
  /* === BACKGROUND LAYERS === */
  --bg-void:       #0D0905;   /* Deepest background — like night sky over Pichola Lake */
  --bg-base:       #120C07;   /* App root background */
  --bg-surface:    #1C1209;   /* Card surface — warm ebony */
  --bg-elevated:   #241808;   /* Elevated panels, modals */
  --bg-overlay:    #2E200E;   /* Hover states, selected rows */
  --bg-muted:      #3A2A14;   /* Disabled states, input fills */
  --bg-glass:      rgba(28, 18, 9, 0.72);   /* Primary glassmorphic surface */
  --bg-glass-light: rgba(44, 28, 12, 0.55); /* Lighter glass for tooltips */

  /* === BORDERS & DIVIDERS === */
  --border-subtle:  rgba(212, 142, 58, 0.12);  /* Almost invisible warm line */
  --border-default: rgba(212, 142, 58, 0.22);  /* Standard card border */
  --border-strong:  rgba(212, 142, 58, 0.45);  /* Active/focus borders */
  --border-glow:    rgba(232, 133, 58, 0.70);  /* Glowing accent border */
}
```

### 1.2 Primary Palette — Saffron & Marigold

*Inspired by: Rajasthani marigold garlands, turmeric, haldi ceremony*

```css
:root {
  /* SAFFRON — Primary Action Color */
  --saffron-50:  #FFF8F0;
  --saffron-100: #FEECDA;
  --saffron-200: #FCD5A8;
  --saffron-300: #F9B86E;
  --saffron-400: #F59A3C;
  --saffron-500: #E8853A;   /* ★ PRIMARY — use for CTAs, links, focus rings */
  --saffron-600: #D06A20;
  --saffron-700: #A85016;
  --saffron-800: #7A3610;
  --saffron-900: #4E2008;

  /* MARIGOLD — Secondary/Highlight */
  --marigold-400: #F5C842;
  --marigold-500: #E8B32A;   /* ★ SECONDARY — badges, highlights, stars */
  --marigold-600: #C8900E;
}
```

### 1.3 Semantic Status Palette

*Inspired by: Rajasthani gem trade — emeralds, rubies, sapphires*

```css
:root {
  /* SUCCESS — Emerald (Hara) */
  --emerald-400: #34D97B;
  --emerald-500: #22C36A;   /* Active seats, success states */
  --emerald-glow: rgba(34, 195, 106, 0.20);

  /* DANGER — Ruby (Laal) */
  --ruby-400: #F26F6F;
  --ruby-500: #E84242;       /* Expired seats, errors */
  --ruby-glow: rgba(232, 66, 66, 0.20);

  /* WARNING — Amber (Peela) */
  --amber-400: #FBBD2C;
  --amber-500: #E8A20A;      /* Expiring soon */
  --amber-glow: rgba(232, 162, 10, 0.20);

  /* INFO — Sapphire (Neela) */
  --sapphire-400: #60B4FF;
  --sapphire-500: #3D9EFF;   /* Vacant seats, info */
  --sapphire-glow: rgba(61, 158, 255, 0.20);

  /* PENDING — Indigo (Neel) */
  --indigo-400: #9B87FF;
  --indigo-500: #7B5FF5;     /* Pending requests */
  --indigo-glow: rgba(123, 95, 245, 0.20);
}
```

### 1.4 Text Palette

```css
:root {
  --text-primary:   #F5E8D4;   /* Warm cream — never pure white, too harsh */
  --text-secondary: #C4A882;   /* Subdued warm tan */
  --text-tertiary:  #8A6E52;   /* Placeholder, metadata */
  --text-disabled:  #5A4433;   /* Disabled form fields */
  --text-inverse:   #0D0905;   /* Text on light/accent backgrounds */
  --text-accent:    #E8853A;   /* Inline highlighted text */
  --text-link:      #F59A3C;   /* Hyperlinks */
}
```

### 1.5 Special Gradient Tokens

```css
:root {
  /* Signature gradients */
  --gradient-primary: linear-gradient(135deg, #E8853A 0%, #F5C842 100%);
  --gradient-glow:    linear-gradient(135deg, #E8853A 0%, #D06A20 100%);
  --gradient-surface: linear-gradient(160deg, #241808 0%, #1C1209 50%, #120C07 100%);
  --gradient-glass:   linear-gradient(135deg, rgba(232,133,58,0.08) 0%, rgba(245,200,66,0.04) 100%);
  --gradient-hero:    radial-gradient(ellipse at 30% 20%, rgba(232,133,58,0.15) 0%, transparent 60%),
                      radial-gradient(ellipse at 70% 80%, rgba(61,158,255,0.08) 0%, transparent 50%);

  /* Jaali pattern gradient (used in decorative borders) */
  --gradient-jaali: repeating-linear-gradient(
    45deg,
    rgba(232,133,58,0.06) 0px,
    rgba(232,133,58,0.06) 1px,
    transparent 1px,
    transparent 8px
  );

  /* Status gradients */
  --gradient-emerald: linear-gradient(135deg, #22C36A, #16A356);
  --gradient-ruby:    linear-gradient(135deg, #E84242, #C02020);
  --gradient-amber:   linear-gradient(135deg, #E8A20A, #C8820A);
  --gradient-sapphire:linear-gradient(135deg, #3D9EFF, #1A7FE8);
}
```

---

## 2. Typography System — The Dual-Script Framework

### 2.1 Font Stack

```css
/* Import in _document.tsx or layout.tsx */
@import url('https://fonts.googleapis.com/css2?family=Yatra+One&family=Tiro+Devanagari+Hindi:ital@0;1&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

:root {
  /* === FONT FAMILIES === */
  --font-devanagari: 'Tiro Devanagari Hindi', 'Yatra One', serif;
  /* Use for: Hindi/Sanskrit labels, section dividers, brand moments */

  --font-display:    'Playfair Display', Georgia, serif;
  /* Use for: Page titles, hero headings, large numbers */

  --font-body:       'Outfit', -apple-system, sans-serif;
  /* Use for: All UI text, labels, paragraphs */

  --font-mono:       'DM Mono', 'Cascadia Code', monospace;
  /* Use for: UTR IDs, seat numbers, timestamps, codes */
}
```

### 2.2 Type Scale

```css
:root {
  /* === MODULAR SCALE (1.25 ratio — Major Third) === */
  --text-xs:   0.64rem;   /* 10.24px — Meta labels, legal text */
  --text-sm:   0.80rem;   /* 12.80px — Captions, helper text */
  --text-base: 1.00rem;   /* 16.00px — Body text baseline */
  --text-md:   1.25rem;   /* 20.00px — Card titles, subheadings */
  --text-lg:   1.56rem;   /* 25.00px — Section headings */
  --text-xl:   1.95rem;   /* 31.25px — Page titles */
  --text-2xl:  2.44rem;   /* 39.06px — Hero numbers, dashboard stats */
  --text-3xl:  3.05rem;   /* 48.83px — Hero display text */
  --text-4xl:  3.81rem;   /* 61.04px — Landing page headline */

  /* === LINE HEIGHTS === */
  --leading-tight:  1.2;
  --leading-snug:   1.35;
  --leading-normal: 1.55;
  --leading-relaxed:1.75;

  /* === LETTER SPACING === */
  --tracking-tight:  -0.03em;
  --tracking-normal:  0em;
  --tracking-wide:    0.06em;
  --tracking-widest:  0.14em;  /* Use for uppercase labels/tags */

  /* === FONT WEIGHTS === */
  --weight-light:   300;
  --weight-regular: 400;
  --weight-medium:  500;
  --weight-semibold:600;
  --weight-bold:    700;
}
```

### 2.3 Typographic Roles

| Role | Font | Size Token | Weight | Use Case |
|---|---|---|---|---|
| `brand-hero` | Devanagari | `--text-3xl` | 400 | Landing "श्री गणगौर" |
| `page-title` | Playfair Display | `--text-xl` | 700 | Dashboard headings |
| `section-label` | Outfit | `--text-sm` | 600 + widest | Uppercase section dividers |
| `card-title` | Outfit | `--text-md` | 600 | Card/panel primary labels |
| `body` | Outfit | `--text-base` | 400 | All readable content |
| `caption` | Outfit | `--text-sm` | 400 | Metadata, timestamps |
| `stat-number` | Playfair Display | `--text-2xl` | 700 | Analytics numbers |
| `seat-label` | DM Mono | `--text-sm` | 500 | Seat IDs (A1, B4...) |
| `utr-code` | DM Mono | `--text-base` | 400 | Transaction IDs |
| `tag-label` | Outfit | `--text-xs` | 600 + widest | Status pills, badges |

---

## 3. Spacing & Layout — The Grid Architecture

### 3.1 Spacing Scale

```css
:root {
  /* 4px base unit — strict geometric progression */
  --space-0:   0px;
  --space-1:   4px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
  --space-16:  64px;
  --space-20:  80px;
  --space-24:  96px;
  --space-32:  128px;
}
```

### 3.2 Border Radius

```css
:root {
  --radius-xs:   4px;    /* Tags, inline chips */
  --radius-sm:   8px;    /* Small buttons, input fields */
  --radius-md:   12px;   /* Cards, panels */
  --radius-lg:   16px;   /* Large cards, modals */
  --radius-xl:   24px;   /* Bottom sheets, floating panels */
  --radius-2xl:  32px;   /* Hero containers */
  --radius-full: 9999px; /* Pills, avatars, circular buttons */
}
```

### 3.3 Shadow System

```css
:root {
  /* Warm-tinted shadow system — NOT the default grey box-shadow */
  --shadow-xs:  0 1px 3px rgba(13, 9, 5, 0.40);
  --shadow-sm:  0 2px 8px rgba(13, 9, 5, 0.50), 0 1px 2px rgba(13, 9, 5, 0.30);
  --shadow-md:  0 4px 20px rgba(13, 9, 5, 0.60), 0 2px 6px rgba(13, 9, 5, 0.40);
  --shadow-lg:  0 8px 40px rgba(13, 9, 5, 0.70), 0 4px 12px rgba(13, 9, 5, 0.50);
  --shadow-xl:  0 20px 60px rgba(13, 9, 5, 0.80), 0 8px 24px rgba(13, 9, 5, 0.60);

  /* Glow shadows — for active/accent elements */
  --shadow-glow-saffron: 0 0 24px rgba(232, 133, 58, 0.35), 0 0 8px rgba(232, 133, 58, 0.20);
  --shadow-glow-emerald: 0 0 24px rgba(34, 195, 106, 0.30), 0 0 8px rgba(34, 195, 106, 0.15);
  --shadow-glow-ruby:    0 0 24px rgba(232, 66, 66, 0.30),  0 0 8px rgba(232, 66, 66, 0.15);
  --shadow-glow-sapphire:0 0 24px rgba(61, 158, 255, 0.30), 0 0 8px rgba(61, 158, 255, 0.15);
  --shadow-glow-amber:   0 0 24px rgba(232, 162, 10, 0.30), 0 0 8px rgba(232, 162, 10, 0.15);
}
```

### 3.4 Breakpoint System

```ts
// breakpoints.ts
export const breakpoints = {
  xs:  '360px',   // Small phones (budget Android)
  sm:  '480px',   // Large phones
  md:  '768px',   // Tablets
  lg:  '1024px',  // Small laptops
  xl:  '1280px',  // Standard desktop
  '2xl': '1536px' // Wide screens
} as const;
```

### 3.5 Z-Index Architecture

```css
:root {
  --z-below:    -1;    /* Background decorative elements */
  --z-base:      0;    /* Content layers */
  --z-above:    10;    /* Sticky elements in flow */
  --z-sticky:   100;   /* Sticky headers */
  --z-overlay:  200;   /* Backdrop overlays */
  --z-drawer:   300;   /* Side panels, drawers */
  --z-modal:    400;   /* Modals, dialogs */
  --z-sheet:    500;   /* Bottom sheets */
  --z-toast:    600;   /* Toasts, notifications */
  --z-tooltip:  700;   /* Tooltips */
  --z-cursor:   9999;  /* Custom cursor */
}
```

---

## 4. Component Design Specifications

### 4.1 The Signature Card Component

The base for all cards. Uses the "carved stone" look — warm dark base with inner glow.

```css
.card-base {
  background: var(--bg-glass);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md), inset 0 1px 0 rgba(245,200,66,0.06);
  /* The inset shadow creates the illusion of a lit top edge — like carved stone */
  position: relative;
  overflow: hidden;
  transition: border-color 220ms ease, box-shadow 220ms ease, transform 220ms ease;
}

.card-base::before {
  /* Jaali decorative corner — top-right */
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 80px; height: 80px;
  background: var(--gradient-jaali);
  opacity: 0.6;
  pointer-events: none;
}

.card-base:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-lg), inset 0 1px 0 rgba(245,200,66,0.10);
  transform: translateY(-2px);
}
```

### 4.2 Seat Status Components

Each seat is a micro-canvas. All states are immediately readable at a glance.

```tsx
// Seat component visual specifications

// VACANT — Deep sapphire
.seat-vacant {
  background: rgba(61, 158, 255, 0.10);
  border: 1.5px solid rgba(61, 158, 255, 0.35);
  color: var(--sapphire-400);
  box-shadow: var(--shadow-glow-sapphire);
  /* Hover: border brightens, seat number becomes bold */
}

// ACTIVE — Emerald with subtle user icon
.seat-active {
  background: rgba(34, 195, 106, 0.12);
  border: 1.5px solid rgba(34, 195, 106, 0.40);
  color: var(--emerald-400);
  box-shadow: var(--shadow-glow-emerald);
}

// EXPIRED — Ruby with pulse animation
.seat-expired {
  background: rgba(232, 66, 66, 0.10);
  border: 1.5px solid rgba(232, 66, 66, 0.35);
  color: var(--ruby-400);
  animation: pulse-expired 2.5s ease-in-out infinite;
}

@keyframes pulse-expired {
  0%, 100% { box-shadow: var(--shadow-glow-ruby); }
  50%       { box-shadow: 0 0 32px rgba(232,66,66,0.55), 0 0 12px rgba(232,66,66,0.30); }
}

// EXPIRING SOON — Amber
.seat-expiring {
  background: rgba(232, 162, 10, 0.10);
  border: 1.5px dashed rgba(232, 162, 10, 0.45); /* Dashed = caution signal */
  color: var(--amber-500);
  box-shadow: var(--shadow-glow-amber);
}
```

### 4.3 Button System

Buttons have four variants — each with distinct visual weight.

```css
/* PRIMARY — Saffron gradient, used for main actions */
.btn-primary {
  background: var(--gradient-glow);
  color: var(--text-inverse);
  font-family: var(--font-body);
  font-weight: var(--weight-semibold);
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-wide);
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  border: none;
  box-shadow: var(--shadow-glow-saffron), var(--shadow-sm);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1); /* Spring easing */
}

.btn-primary::after {
  /* Shimmer sweep on hover */
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
  transform: translateX(-100%);
  transition: transform 500ms ease;
}
.btn-primary:hover::after { transform: translateX(100%); }
.btn-primary:hover        { transform: scale(1.03); box-shadow: var(--shadow-glow-saffron), var(--shadow-md); }
.btn-primary:active       { transform: scale(0.97); }

/* SECONDARY — Ghost with border */
.btn-secondary {
  background: transparent;
  color: var(--saffron-400);
  border: 1.5px solid var(--border-strong);
  padding: 11px 23px; /* 1px less to account for border */
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-weight: var(--weight-medium);
  font-size: var(--text-sm);
  transition: all 200ms ease;
}
.btn-secondary:hover {
  background: rgba(232, 133, 58, 0.08);
  border-color: var(--border-glow);
}

/* DANGER */
.btn-danger {
  background: rgba(232, 66, 66, 0.12);
  color: var(--ruby-400);
  border: 1.5px solid rgba(232, 66, 66, 0.25);
  /* Same padding/radius as secondary */
}
.btn-danger:hover {
  background: rgba(232, 66, 66, 0.22);
  box-shadow: var(--shadow-glow-ruby);
}

/* GHOST — Minimal, for tertiary actions */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: none;
  padding: 8px 16px;
}
.btn-ghost:hover { color: var(--text-primary); background: rgba(245,200,66,0.06); }

/* ICON BUTTON — Circular, single icon */
.btn-icon {
  width: 40px; height: 40px;
  border-radius: var(--radius-full);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  display: grid; place-items: center;
  color: var(--text-secondary);
  transition: all 180ms ease;
}
.btn-icon:hover {
  background: var(--bg-overlay);
  border-color: var(--border-default);
  color: var(--text-primary);
}
```

### 4.4 Form Inputs — Floating Label System

```css
.input-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
}

.input-field {
  background: var(--bg-muted);
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 20px 16px 8px; /* Top padding for float space */
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-primary);
  outline: none;
  transition: border-color 200ms ease, box-shadow 200ms ease, background 200ms ease;
  caret-color: var(--saffron-500);
}

.input-label {
  position: absolute;
  top: 14px; left: 16px;
  font-size: var(--text-base);
  color: var(--text-tertiary);
  pointer-events: none;
  transition: all 180ms cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: left top;
}

/* Floating state — when focused or has value */
.input-field:focus ~ .input-label,
.input-field:not(:placeholder-shown) ~ .input-label {
  transform: translateY(-9px) scale(0.75);
  color: var(--saffron-400);
}

.input-field:focus {
  border-color: var(--border-glow);
  box-shadow: 0 0 0 3px rgba(232, 133, 58, 0.15), var(--shadow-xs);
  background: var(--bg-elevated);
}

/* Error state */
.input-field.is-error {
  border-color: var(--ruby-500);
  box-shadow: 0 0 0 3px rgba(232, 66, 66, 0.15);
}

/* Helper text */
.input-helper {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: var(--space-1);
  padding-left: var(--space-4);
}
.input-helper.is-error { color: var(--ruby-400); }
```

### 4.5 Status Badge / Pills

```tsx
// Semantic status pill component
interface BadgeProps {
  variant: 'active' | 'expired' | 'expiring' | 'vacant' | 'pending' | 'morning' | 'evening' | 'full';
}

// CSS specs for each variant:
const badgeStyles = {
  active:   { bg: 'emerald-glow',  border: 'emerald',  text: 'emerald-400',  label: 'Active'         },
  expired:  { bg: 'ruby-glow',     border: 'ruby',     text: 'ruby-400',     label: 'Expired'        },
  expiring: { bg: 'amber-glow',    border: 'amber',    text: 'amber-400',    label: 'Expiring Soon'  },
  vacant:   { bg: 'sapphire-glow', border: 'sapphire', text: 'sapphire-400', label: 'Vacant'         },
  pending:  { bg: 'indigo-glow',   border: 'indigo',   text: 'indigo-400',   label: 'Pending'        },
  morning:  { bg: 'amber-glow',    border: 'amber',    text: 'amber-400',    label: '🌅 Morning'     },
  evening:  { bg: 'indigo-glow',   border: 'indigo',   text: 'indigo-400',   label: '🌙 Evening'    },
  full:     { bg: 'saffron-glow',  border: 'saffron',  text: 'saffron-400',  label: '☀️ Full Day'   },
};

// Base badge CSS:
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  border: 1px solid currentColor;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
}
```

### 4.6 The UTR/Transaction ID Display

*This element is critical — admin needs to verify payment codes at speed.*

```css
.utr-display {
  background: var(--bg-muted);
  border: 2px solid rgba(34, 195, 106, 0.40); /* Emerald — verified/financial */
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-mono);
  font-size: var(--text-base);
  color: var(--emerald-400);
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  box-shadow: var(--shadow-glow-emerald);
  cursor: pointer; /* Copy on click */
  position: relative;
  overflow: hidden;
}

.utr-display::before {
  /* "verified" green left accent line */
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--gradient-emerald);
}

/* Copy feedback animation */
.utr-display.copied {
  animation: flash-copied 400ms ease;
}
@keyframes flash-copied {
  0%   { background: rgba(34, 195, 106, 0.05); }
  50%  { background: rgba(34, 195, 106, 0.20); }
  100% { background: var(--bg-muted); }
}
```

### 4.7 QR Code Payment Container

```css
.qr-container {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  position: relative;
  box-shadow: var(--shadow-lg);
}

/* Corner decorative accents — Jaali-inspired */
.qr-container::before,
.qr-container::after {
  content: '';
  position: absolute;
  width: 32px; height: 32px;
  border-color: var(--saffron-500);
  border-style: solid;
  border-width: 0;
  opacity: 0.6;
}
.qr-container::before { top: 12px; left: 12px; border-top-width: 2px; border-left-width: 2px; }
.qr-container::after  { bottom: 12px; right: 12px; border-bottom-width: 2px; border-right-width: 2px; }

/* QR Code itself */
.qr-code-wrapper {
  background: #FFFFFF; /* QR always needs white bg */
  padding: var(--space-4);
  border-radius: var(--radius-md);
  box-shadow: 0 0 40px rgba(232, 133, 58, 0.25), var(--shadow-md);
}

/* Amount display above QR */
.qr-amount {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
}
.qr-amount span { color: var(--saffron-500); }
```

---

## 5. Animation & Motion System

### 5.1 Easing Tokens

```css
:root {
  /* === EASING CURVES === */
  --ease-standard:   cubic-bezier(0.4, 0.0, 0.2, 1.0);  /* Material standard */
  --ease-enter:      cubic-bezier(0.0, 0.0, 0.2, 1.0);  /* Decelerate — elements entering */
  --ease-exit:       cubic-bezier(0.4, 0.0, 1.0, 1.0);  /* Accelerate — elements leaving */
  --ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1); /* Overshoot spring — for fun moments */
  --ease-bounce:     cubic-bezier(0.68, -0.55, 0.27, 1.55); /* Bounce — for confirmations */
  --ease-smooth:     cubic-bezier(0.25, 0.46, 0.45, 0.94); /* Smooth, gentle */
}
```

### 5.2 Duration Scale

```css
:root {
  --duration-instant:  80ms;   /* Immediate feedback (button press) */
  --duration-fast:    150ms;   /* Micro interactions, hover */
  --duration-normal:  250ms;   /* Standard transitions */
  --duration-slow:    380ms;   /* Modals, panels entering */
  --duration-lazy:    550ms;   /* Page transitions, large animations */
  --duration-dramatic:800ms;   /* Hero reveals, onboarding moments */
}
```

### 5.3 Framer Motion Variants Library

```tsx
// animations/variants.ts

// Page transition — slide + fade
export const pageVariants = {
  initial:  { opacity: 0, y: 16 },
  animate:  { opacity: 1, y: 0,  transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:     { opacity: 0, y: -8, transition: { duration: 0.25, ease: [0.4, 0.0, 1.0, 1.0] } }
};

// Staggered list reveal — use for member lists, seat grids
export const listVariants = {
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } }
};
export const listItemVariants = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.28, ease: [0.34, 1.56, 0.64, 1] } }
};

// Bottom sheet — spring from bottom
export const bottomSheetVariants = {
  initial: { y: '100%' },
  animate: { y: 0, transition: { type: 'spring', damping: 28, stiffness: 260 } },
  exit:    { y: '100%', transition: { duration: 0.25, ease: [0.4, 0.0, 1.0, 1.0] } }
};

// Side drawer — from right
export const drawerVariants = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { type: 'spring', damping: 30, stiffness: 280 } },
  exit:    { x: '100%', transition: { duration: 0.25, ease: [0.4, 0.0, 1.0, 1.0] } }
};

// Modal — scale + fade
export const modalVariants = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1,   transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] } },
  exit:    { opacity: 0, scale: 0.96, transition: { duration: 0.2, ease: [0.4, 0.0, 1.0, 1.0] } }
};

// Number counter — for stats on analytics page
export const useCountUp = (target: number, duration = 1200) => { /* ... */ };

// Wrong PIN wiggle (existing behavior, formalized)
export const wiggleVariants = {
  shake: {
    x: [0, -10, 10, -8, 8, -4, 4, 0],
    transition: { duration: 0.5, ease: 'easeInOut' }
  }
};

// Toast notification
export const toastVariants = {
  initial: { opacity: 0, y: 24, scale: 0.92 },
  animate: { opacity: 1, y: 0,  scale: 1,   transition: { type: 'spring', damping: 22, stiffness: 300 } },
  exit:    { opacity: 0, y: -8, scale: 0.96, transition: { duration: 0.2 } }
};
```

### 5.4 CSS Micro-interaction Signatures

```css
/* === SEAT HOVER — Scale tap === */
.seat-btn {
  transition: transform var(--duration-fast) var(--ease-spring),
              box-shadow var(--duration-fast) var(--ease-standard);
  will-change: transform;
}
.seat-btn:hover  { transform: scale(1.08); }
.seat-btn:active { transform: scale(0.93); }

/* === LINK / NAV ITEM — Underline sweep === */
.nav-link::after {
  content: '';
  display: block;
  height: 2px;
  background: var(--gradient-primary);
  border-radius: 1px;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 240ms var(--ease-standard);
}
.nav-link:hover::after,
.nav-link.active::after { transform: scaleX(1); }

/* === SWITCH TOGGLE — Smooth thumb === */
.toggle-track {
  width: 48px; height: 26px;
  border-radius: var(--radius-full);
  background: var(--bg-muted);
  border: 1.5px solid var(--border-default);
  position: relative;
  cursor: pointer;
  transition: background 200ms ease, border-color 200ms ease;
}
.toggle-track.is-on {
  background: rgba(34, 195, 106, 0.25);
  border-color: var(--emerald-500);
}
.toggle-thumb {
  width: 20px; height: 20px;
  border-radius: var(--radius-full);
  background: var(--text-tertiary);
  position: absolute;
  top: 2px; left: 2px;
  transition: transform 220ms var(--ease-spring), background 200ms ease;
  box-shadow: var(--shadow-xs);
}
.toggle-track.is-on .toggle-thumb {
  transform: translateX(22px);
  background: var(--emerald-500);
}

/* === SKELETON LOADING — Warm shimmer === */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-muted) 0%,
    var(--bg-overlay) 50%,
    var(--bg-muted) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 6. Decorative System — The "Heritage Layer"

This is what separates this design from generic glassmorphic dashboards. These are the cultural fingerprints.

### 6.1 Jaali (Lattice) Pattern

```css
/* Used as: Section dividers, card backgrounds, decorative panels */
.jaali-pattern {
  background-image:
    repeating-linear-gradient(0deg,   transparent, transparent 7px, rgba(232,133,58,0.08) 7px, rgba(232,133,58,0.08) 8px),
    repeating-linear-gradient(90deg,  transparent, transparent 7px, rgba(232,133,58,0.08) 7px, rgba(232,133,58,0.08) 8px),
    repeating-linear-gradient(45deg,  transparent, transparent 4px, rgba(232,133,58,0.04) 4px, rgba(232,133,58,0.04) 5px),
    repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(232,133,58,0.04) 4px, rgba(232,133,58,0.04) 5px);
}
```

### 6.2 Decorative Dividers

```tsx
// components/ui/Divider.tsx
// Three variants:

// 1. Diamond divider — separates major sections
<div className="divider-diamond">
  {/* ——————◆—————— */}
  {/* Rendered with CSS pseudo-elements */}
</div>

// 2. Dashed fade — soft section breaks
<div className="divider-fade" />

// 3. Double-line — for formal sections (like traditional document ruling)
<div className="divider-double" />

// CSS:
.divider-diamond {
  display: flex; align-items: center; gap: var(--space-3);
  color: var(--text-tertiary);
}
.divider-diamond::before,
.divider-diamond::after {
  content: ''; flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-default), transparent);
}
```

### 6.3 Background Atmospheric Layer

*Applied on the root `<body>` — the soul of the design.*

```css
body {
  background-color: var(--bg-base);
  background-image:
    /* Radial warm light — like a lamp in the corner of a haveli */
    radial-gradient(ellipse 80% 50% at 15% 10%, rgba(232,133,58,0.10) 0%, transparent 70%),
    /* Cool counter-light — lake reflection */
    radial-gradient(ellipse 60% 40% at 85% 90%, rgba(61,158,255,0.06) 0%, transparent 60%),
    /* Grain texture — natural paper feel */
    url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  min-height: 100vh;
}
```

---

## 7. Page-Specific Design Blueprints

### 7.1 Landing Page — Redesigned

**Goal:** A singular emotional impression in under 2 seconds.

```
┌──────────────────────────────────────────────────────────────────┐
│  [atmospheric bg: warm radial glow, grain texture]               │
│                                                                  │
│                    [Jaali decorative border — top]               │
│                                                                  │
│         ┌──────────────────────────────────────────┐            │
│         │   श्री गणगौर Library                    │            │
│         │   [Tiro Devanagari, gradient text]        │            │
│         │                                           │            │
│         │   ✦  Udaipur's Premier Study Space  ✦     │            │
│         │   [Outfit Regular, muted — subheadline]   │            │
│         │                                           │            │
│         │   [ Browse Available Seats  →  ]          │            │
│         │   [Primary btn — glowing saffron]         │            │
│         │                                           │            │
│         │   ─────────────◆─────────────             │            │
│         │                                           │            │
│         │   Admin Access                            │            │
│         │   [Floating label PIN input]              │            │
│         │   [ Enter Admin Area  →  ]                │            │
│         │   [Secondary ghost button]                │            │
│         └──────────────────────────────────────────┘            │
│                                                                  │
│                    [Jaali decorative border — bottom]            │
└──────────────────────────────────────────────────────────────────┘
```

**Interaction details:**
- Brand title entrance: letters fade in with 40ms stagger, slight upward drift
- The hero card floats over the atmospheric background, not embedded in it
- PIN field: on focus, the card's top border sweeps with a saffron gradient light
- On wrong PIN: wiggle + a soft red tint washes the card border for 600ms then fades

### 7.2 Floor Plan Dashboard — Layout Blueprint

```
┌─────────────────────────────────────────────────────────────────┐
│  STICKY HEADER                                                   │
│  [Logo mark]  [ ∷ Gangaur Library ]    [🔍 Search]  [⚡ Actions]│
├───────────────────────────────────┬─────────────────────────────┤
│                                   │                             │
│   SEAT GRID CANVAS                │  SEAT DETAIL PANEL          │
│   (Full height, scrollable)       │  (Slides in from right      │
│                                   │   only on seat click)       │
│   Row A: [A1][A2][A3][A4]...      │  ┌───────────────────────┐  │
│          [A5][A6][A7][A8]...      │  │ Member Name           │  │
│                                   │  │ [Avatar + Status]     │  │
│   Row B: [B1][B2]...[B12]         │  │                       │  │
│                                   │  │ Seat: B7 · Full Day   │  │
│   [LEGEND BAR]                    │  │ Expires: Apr 12, 2026 │  │
│   ● Active  ● Vacant              │  │ Phone: xxxxxxxx89     │  │
│   ● Expired ● Expiring            │  │                       │  │
│                                   │  │ [Renew] [Vacate]      │  │
│                                   │  └───────────────────────┘  │
└───────────────────────────────────┴─────────────────────────────┘
```

**Grid design rules:**
- Seats are `48×52px` on desktop, `40×44px` on mobile
- Seats arranged in physically accurate rows with aisle gap (24px) between row groups
- Color-coded by status, icons overlaid at 60% opacity (user icon for occupied)
- Seat number in `--font-mono`, centered

### 7.3 Request Inbox — Card Design Spec

```
┌─────────────────────────────────────────────────────────────────┐
│  [ Pending (3) ] [ Approved ] [ Rejected ] [ All ]              │
│   ──── Tab pills with animated indicator dot ────               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ [Avatar]  Ramesh Kumar                 Seat A7 · Morning  │   │
│  │           +91 98765 43210             2 hours ago        │   │
│  │                                                          │   │
│  │  UTR CODE                                                │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ ▌  UTR123456789012                    [Copy 📋]  │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  Duration: 1 Month        Amount: ₹500                   │   │
│  │                                                          │   │
│  │  [ ✓ Verify & Add Member ]    [ ✗ Reject ]               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Analytics Dashboard — Visual Language

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Total   │  │ Check-In │  │ Revenue  │  │ Expiring │       │
│  │  Members │  │  Today   │  │  Month   │  │  Soon    │       │
│  │          │  │          │  │          │  │          │       │
│  │  [stat]  │  │  [stat]  │  │  [stat]  │  │  [stat]  │       │
│  │ [spark]  │  │ [spark]  │  │ [spark]  │  │ [spark]  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                  │
│  ┌─────────────────────────────┐  ┌────────────────────────┐   │
│  │  Revenue Trend              │  │  Shift Breakdown       │   │
│  │  [Bezier sparkline chart]   │  │  [Donut — 3 segments]  │   │
│  │                             │  │  Morning 45%           │   │
│  │                             │  │  Evening 30%           │   │
│  │                             │  │  Full Day 25%          │   │
│  └─────────────────────────────┘  └────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Analytics design rules:**
- Stat numbers use `--font-display` (Playfair Display) at `--text-2xl` — gives them editorial weight
- Sparklines: 2px stroke in the card's accent color, no fills, `stroke-linecap: round`
- Donut chart: 8px gap between segments, animated on entrance (arc grows from 0)
- Revenue figures: formatted as `₹ 12,500` with `₹` in saffron, number in primary text

---

## 8. Navigation System

### 8.1 Desktop Sticky Header

```css
.app-header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  height: 64px;
  background: var(--bg-glass);
  backdrop-filter: blur(24px) saturate(1.6);
  -webkit-backdrop-filter: blur(24px) saturate(1.6);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  padding: 0 var(--space-6);
  gap: var(--space-6);
  box-shadow: 0 1px 0 var(--border-subtle), 0 4px 20px rgba(13,9,5,0.40);
}

/* Scroll-aware: header border brightens on scroll */
.app-header.scrolled {
  border-bottom-color: var(--border-default);
  box-shadow: 0 1px 0 var(--border-default), var(--shadow-md);
}
```

### 8.2 Mobile Bottom Navigation

```css
.mobile-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: var(--z-sticky);
  height: 68px; /* + safe area inset for notch phones */
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--bg-glass);
  backdrop-filter: blur(24px);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.mobile-nav-item {
  display: flex; flex-direction: column;
  align-items: center; gap: 3px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
  transition: color 200ms ease, background 200ms ease;
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
}

.mobile-nav-item.active {
  color: var(--saffron-400);
  background: rgba(232, 133, 58, 0.10);
}

/* Active indicator dot above icon */
.mobile-nav-item.active::before {
  content: ''; display: block;
  width: 4px; height: 4px;
  border-radius: 2px;
  background: var(--saffron-500);
  margin-bottom: -2px;
  box-shadow: var(--shadow-glow-saffron);
}
```

### 8.3 Global Search Component

```css
.global-search {
  position: relative;
  width: 280px;
}

.search-input {
  width: 100%;
  background: var(--bg-muted);
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--radius-full);
  padding: 9px 16px 9px 40px; /* left space for icon */
  font-size: var(--text-sm);
  color: var(--text-primary);
  transition: all 220ms var(--ease-standard);
}
.search-input:focus {
  width: 360px; /* Expands on focus */
  border-color: var(--border-strong);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-glow-saffron);
}

/* Result dropdown */
.search-dropdown {
  position: absolute; top: calc(100% + 8px); left: 0; right: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  backdrop-filter: blur(24px);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  max-height: 320px;
  overflow-y: auto;
}

.search-result-item {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  transition: background 150ms ease;
  cursor: pointer;
}
.search-result-item:hover { background: var(--bg-overlay); }
```

---

## 9. Toast Notification System

### Design Spec

```tsx
// Four toast types: success, error, warning, info
// All appear bottom-center on mobile, top-right on desktop
// Auto-dismiss: 4s with progress bar

.toast {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  min-width: 280px;
  max-width: 380px;
  position: relative;
  overflow: hidden;
}

/* Left accent bar — colored by type */
.toast::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
}
.toast-success::before { background: var(--gradient-emerald); }
.toast-error::before   { background: var(--gradient-ruby); }
.toast-warning::before { background: var(--gradient-amber); }
.toast-info::before    { background: var(--gradient-sapphire); }

/* Progress bar at bottom — auto-dismiss indicator */
.toast-progress {
  position: absolute;
  bottom: 0; left: 4px; right: 0; height: 2px;
  background: currentColor; opacity: 0.3;
  animation: toast-progress 4s linear forwards;
}
@keyframes toast-progress {
  from { width: 100%; }
  to   { width: 0%; }
}
```

---

## 10. Accessibility Standards

### 10.1 Focus Visibility

```css
/* Global focus ring — warm, unmissable, beautiful */
:focus-visible {
  outline: 2px solid var(--saffron-500);
  outline-offset: 3px;
  border-radius: var(--radius-xs);
  box-shadow: 0 0 0 4px rgba(232, 133, 58, 0.20);
}

/* Remove for mouse users */
:focus:not(:focus-visible) { outline: none; }
```

### 10.2 Color Contrast Requirements

| Text/Element | Background | Contrast | Status |
|---|---|---|---|
| `--text-primary` (#F5E8D4) | `--bg-surface` (#1C1209) | **14.8:1** | ✅ AAA |
| `--text-secondary` (#C4A882) | `--bg-surface` (#1C1209) | **7.2:1** | ✅ AA |
| `--saffron-400` (#F59A3C) | `--bg-base` (#120C07) | **8.1:1** | ✅ AA |
| `--emerald-400` (#34D97B) | `--bg-surface` (#1C1209) | **9.3:1** | ✅ AAA |
| Badge text on glow bg | Status glow bg | **5.5:1+** | ✅ AA |

### 10.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .seat-expired { animation: none; border-style: solid; }
  .skeleton { animation: none; background: var(--bg-muted); }
}
```

### 10.4 Touch Targets

```css
/* All interactive elements: minimum 44×44px touch target */
.seat-btn, .btn-icon, .toggle-track, .mobile-nav-item {
  min-width: 44px;
  min-height: 44px;
}

/* For smaller visual elements, use padding to expand hit area */
.tag-chip { padding: 10px 14px; } /* Visual: smaller, touch: 44px height */
```

---

## 11. Performance Architecture

### 11.1 CSS Optimization

```css
/* GPU-accelerated layers — declare upfront for animated elements */
.seat-btn, .card-base, .bottom-sheet, .side-drawer, .modal-overlay {
  will-change: transform;
  transform: translateZ(0); /* Create compositing layer */
}

/* Contain layout for large lists */
.seat-grid { contain: layout style; }
.member-list-item { contain: layout; }

/* Reduce paint area for blur effects */
.app-header, .bottom-sheet, .search-dropdown {
  isolation: isolate; /* New stacking context */
}
```

### 11.2 Critical Font Loading

```html
<!-- In <head> — prevent FOUT -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- font-display: swap for body font, optional for display font -->
<!-- Critical: Outfit (body) loaded first, Playfair Display deferred -->
```

### 11.3 Image & Icon Optimization

- Use **Lucide React** icons at `20px` stroke `1.5` for all UI icons (consistent with spec)
- Set `icon-rendering: crispEdges` for seat status icons
- All avatar images: lazy-loaded, `loading="lazy"`, with skeleton fallback
- QR Code: rendered client-side via `QRCodeCanvas` — no network roundtrip

---

## 12. Dark/Light Mode Consideration

> **Recommendation:** Stay warm dark. Don't implement light mode for v1.

The brand identity is intrinsically warm dark — the logo, the cultural aesthetic, the late-night study space atmosphere. A light mode would fight the identity. If needed later:

```css
/* Only add if explicitly requested — these are the light mode tokens */
@media (prefers-color-scheme: light) {
  /* NOTE: Not recommended for this product. Override with: */
  /* <html data-theme="dark"> and ignore this media query */
}
```

---

## 13. Implementation Priority — Build Order

### Phase 1: Foundation (Week 1)
1. `globals.css` — All CSS tokens above
2. Typography setup — Font imports + role classes
3. `components/ui/Button.tsx` — All 5 variants
4. `components/ui/Input.tsx` — Floating label
5. `components/ui/Badge.tsx` — Status pills
6. `components/ui/Card.tsx` — Base card
7. `animations/variants.ts` — All Framer Motion variants
8. Toast system

### Phase 2: Core Pages (Week 2)
9. Landing page — Full redesign
10. Admin Floor Plan — Seat grid + header
11. SeatDetailPanel — Right drawer
12. Global search

### Phase 3: Supporting Pages (Week 3)
13. Request inbox — Full redesign
14. Analytics dashboard — Charts
15. Attendance page — Toggle system
16. Mobile bottom nav

### Phase 4: Polish (Week 4)
17. Skeleton loaders — All loading states
18. Error states — Empty states with illustrations
19. Onboarding flow — First-time admin setup
20. Accessibility audit — Contrast, keyboard nav, screen reader

---

## 14. Quick Reference Card

```
FONTS:        Devanagari = Tiro Devanagari Hindi (brand moments)
              Display    = Playfair Display (headings, stats)
              Body       = Outfit (everything else)
              Mono       = DM Mono (codes, seat numbers)

COLORS:       Primary action   = #E8853A (Saffron)
              Secondary/Gold   = #E8B32A (Marigold)
              Active/Success   = #22C36A (Emerald)
              Error/Expired    = #E84242 (Ruby)
              Warning/Expiring = #E8A20A (Amber)
              Info/Vacant      = #3D9EFF (Sapphire)
              Body text        = #F5E8D4 (Warm cream)
              Base background  = #120C07 (Deep ebony)

RADII:        Tags=4px  Inputs=8px  Cards=12px  Modals=16px  Sheets=24px

MOTION:       Enter = spring(damping:28, stiffness:260)
              Exit  = ease-out 250ms
              Hover = ease 150-200ms
              Wiggle = x:[0,-10,10,-8,8,-4,4,0] 500ms

DECORATIVE:   Jaali grid pattern on elevated surfaces
              Brushstroke accent in hero areas
              Diagonal grid in background
              Corner accent brackets on QR container
              Diamond dividers between sections
```

---

*Design system authored for श्री गणगौर Library, Udaipur, Rajasthan.*
*Version 1.0 — April 2026*
*"हर पन्ने में एक दुनिया।" — Every page holds a world.*
