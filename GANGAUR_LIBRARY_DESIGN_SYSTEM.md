# श्री गणगौर Library — Complete Design System
### *Heritage Modernism · Udaipur, Rajasthan*

> **Design Philosophy:** "हवेली meets Modern UI" — The warmth of Rajasthani elements fused with a clean, firm, and bright interface. Every pixel should feel like it belongs to a well-lit, organized, and inviting study space.

---

## 0. The Concept — Why This Design Direction

The design language has shifted from a dark "glassmorphic" aesthetic to a firm, light-mode design. The focus is now on legibility, crisp borders, and solid surfaces.

- **Clean Light Surfaces** instead of murky glass
- **Firm Borders & Geometry** instead of diffuse glows
- **High Contrast Typography** for optimal reading and scanning
- **Saffron & Marigold Accents** maintained for brand identity

---

## 1. Color System — The Full Token Architecture

### 1.1 Background Palette (Light & Firm Foundation)

```css
:root {
  /* === BACKGROUND LAYERS === */
  --bg-void:       #F8FAFC;   /* Deepest background — soft slate */
  --bg-base:       #FFFFFF;   /* App root background */
  --bg-surface:    #FFFFFF;   /* Card surface — pure white */
  --bg-elevated:   #F1F5F9;   /* Elevated panels, modals */
  --bg-overlay:    #E2E8F0;   /* Hover states, selected rows */
  --bg-muted:      #F1F5F9;   /* Disabled states, input fills */
  --bg-glass:      #FFFFFF;   /* No glass, solid white */
  --bg-glass-light: #FFFFFF;  /* No glass, solid white */

  /* === BORDERS & DIVIDERS === */
  --border-subtle:  #E2E8F0;
  --border-default: #CBD5E1;
  --border-strong:  #94A3B8;
  --border-glow:    #E8853A;
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

```css
:root {
  /* SUCCESS — Emerald (Hara) */
  --emerald-50: #ECFDF5;
  --emerald-200: #A7F3D0;
  --emerald-400: #34D97B;
  --emerald-500: #22C36A;   /* Active seats, success states */
  --emerald-700: #047857;

  /* DANGER — Ruby (Laal) */
  --ruby-50: #FEF2F2;
  --ruby-200: #FECACA;
  --ruby-400: #F26F6F;
  --ruby-500: #E84242;       /* Expired seats, errors */
  --ruby-700: #B91C1C;

  /* WARNING — Amber (Peela) */
  --amber-50: #FFFBEB;
  --amber-200: #FDE68A;
  --amber-400: #FBBD2C;
  --amber-500: #E8A20A;      /* Expiring soon */
  --amber-700: #B45309;

  /* INFO — Sapphire (Neela) */
  --sapphire-50: #EFF6FF;
  --sapphire-200: #BFDBFE;
  --sapphire-400: #60B4FF;
  --sapphire-500: #3D9EFF;   /* Vacant seats, info */
  --sapphire-700: #1D4ED8;

  /* PENDING — Indigo (Neel) */
  --indigo-50: #EEF2FF;
  --indigo-200: #C7D2FE;
  --indigo-400: #9B87FF;
  --indigo-500: #7B5FF5;     /* Pending requests */
  --indigo-700: #4338CA;
}
```

### 1.4 Text Palette

```css
:root {
  --text-primary:   #0F172A;   /* Dark slate for high contrast */
  --text-secondary: #334155;   /* Subdued text */
  --text-tertiary:  #64748B;   /* Placeholder, metadata */
  --text-disabled:  #94A3B8;   /* Disabled form fields */
  --text-inverse:   #FFFFFF;   /* Text on dark/accent backgrounds */
  --text-accent:    #E8853A;   /* Inline highlighted text */
  --text-link:      #F59A3C;   /* Hyperlinks */
}
```

---

## 2. Component Design Specifications

### 2.1 The Signature Card Component

Uses firm borders and solid backgrounds.

```css
.card-base {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  position: relative;
  overflow: hidden;
  transition: border-color 220ms ease, box-shadow 220ms ease, transform 220ms ease;
}

.card-base:hover {
  border-color: var(--border-strong);
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  transform: translateY(-2px);
}
```

### 2.2 Seat Status Components

Firm borders and light colorful backgrounds for status.

```css
// VACANT
.seat-vacant {
  background: var(--bg-surface);
  border: 1.5px solid var(--border-default);
  color: var(--text-secondary);
}

// ACTIVE
.seat-active {
  background: var(--emerald-50);
  border: 1.5px solid var(--emerald-200);
  color: var(--emerald-700);
}

// EXPIRED
.seat-expired {
  background: var(--ruby-50);
  border: 1.5px solid var(--ruby-200);
  color: var(--ruby-700);
}

// EXPIRING SOON
.seat-expiring {
  background: var(--amber-50);
  border: 1.5px dashed var(--amber-400);
  color: var(--amber-700);
}
```

### 2.3 Form Inputs — Floating Label System

```css
.input-field {
  background: var(--bg-base);
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: 20px 16px 8px; /* Top padding for float space */
  color: var(--text-primary);
  outline: none;
  transition: border-color 200ms ease;
}

.input-field:focus {
  border-color: var(--saffron-500);
  box-shadow: 0 0 0 3px var(--saffron-100);
}

.input-field.is-error {
  border-color: var(--ruby-500);
  box-shadow: 0 0 0 3px var(--ruby-100);
}
```
