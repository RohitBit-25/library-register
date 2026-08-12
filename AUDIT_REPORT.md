# Gangaur Library — Full Stack Audit Report

**Project:** `library-register` — Next.js 16.2.1 / React 19.2.4 / Tailwind v4 / MongoDB (Mongoose 9)
**Audited:** 12 Aug 2026
**Scope:** Frontend (26 components, 14 routes), Backend (10 API routes), Database (4 Mongoose models), Design system
**Verified against:** `tsc --noEmit` (clean), `eslint` (2 warnings), WCAG 2.1 AA computed contrast ratios

---

## 0a. Status — what has already been applied

The palette work (§2, §3) is **done and verified**. Everything else in this report is still outstanding.

| Item | State |
|---|---|
| §2 — 13 undefined colour tokens | **Fixed.** All ramps completed 50→900. Expired / fee-due seats now render their status colour |
| §3.2 — light palette | **Applied** to `app/globals.css`. Warm-neutral ground, saffron brand preserved |
| §3.3 — ramp contract | **Documented** as a comment block at the top of `:root` |
| §3.4 — `Badge`, `Button`, `Toast`, `StatCard`, `Sidebar`, `TopBar` | **Fixed** — plus a sweep of ~150 further `text-[var(--*-400/500)]` sites across 22 files |
| #11 — emoji icons in `Badge` | **Fixed** — now `Sun` / `Moon` / `SunMoon` from lucide, `aria-hidden` |
| #9, #10 — PWA theme colour + status bar | **Fixed** — `manifest.json` and `layout.tsx` both `#FBFAF8`, `statusBarStyle: "default"` |
| — `maximumScale: 1` in viewport | **Removed.** It blocked pinch-zoom entirely (WCAG 1.4.4) — found while editing `layout.tsx` |

Verified by: `scripts/check-contrast.py` (20/20 pass), the token diff in §9 (empty), `tsc --noEmit` (clean), `eslint` (2 pre-existing warnings), `next build` (21 routes, success).

Not touched: `app/landing/page.tsx` (#5) still carries its own dark inline stylesheet — that is a rewrite, not a token swap, and is sequenced for week 3.

---

## 0. Executive Summary

| Area | Verdict |
|---|---|
| **Architecture** | Sound shape (App Router + SWR + Mongoose), but two parallel auth systems and no server-side route protection |
| **Light theme** | ~85% converted. Landing page is still fully dark; 13 colour tokens are used but never defined |
| **Colour contrast** | **Fails WCAG AA in 24 of 30 measured combinations.** Root cause: the palette's `-400`/`-500` shades were tuned for a dark background and never re-tuned for white |
| **Security** | **3 critical, 5 high.** Hardcoded JWT signing fallback, public DB-wipe endpoint, public PII lookup by phone |
| **Database** | Correct models, but lost-update races on attendance, unbounded audit log, base64 ID documents stored in-line |
| **Type safety** | Clean. `strict: true`, zero `tsc` errors |
| **Tests** | None |

**Fix in this order:** §1 (security) → §2 (broken tokens — things are literally invisible) → §3 (palette) → §4 (landing page) → everything else.

---

## 1. CRITICAL — Fix Before Any Deployment

### 1.1 JWT signing key falls back to a public hardcoded string

`lib/auth-server.ts:4`

```ts
const secretKey = process.env.ADMIN_SECRET || 'library-admin-secret-key-change-me';
```

`.env` contains only `MONGODB_URI` and `ADMIN_PIN`. **`ADMIN_SECRET` is not set**, so every session token in this app is signed with a constant that lives in the source tree. Anyone who reads the repo can forge an `admin_session` cookie with `{isAdmin: true}` and gain full admin access without ever seeing the PIN.

**Fix:** fail closed at boot.

```ts
const secretKey = process.env.ADMIN_SECRET;
if (!secretKey || secretKey.length < 32) {
  throw new Error('ADMIN_SECRET must be set to a random 32+ char string');
}
const key = new TextEncoder().encode(secretKey);
```

Generate with `openssl rand -base64 48`. Rotating this invalidates all existing sessions — that is the desired outcome.

### 1.2 Public endpoint wipes the entire members collection

`app/api/debug/seed/route.ts:6-17` — an unauthenticated `GET` that runs `Member.deleteMany({})`.

```
curl https://your-app/api/debug/seed
```

That is a total data loss, triggered by a URL a search-engine crawler could hit. It has no auth check, no method restriction, and `GET` should never mutate.

**Fix:** delete the file. Seed from a script (`npm run seed`) instead. If you must keep it: `verifyAdmin()` + `POST` + `if (process.env.NODE_ENV === 'production') return 404`.

### 1.3 Anyone can read anyone's ID documents by guessing a phone number

`app/api/requests/my/route.ts:23-43` is public by design and returns **every field** of every matching request:

```
GET /api/requests/my?phone=9829230576
→ [{ userName, userPhone, transactionId, documentUrl: "data:image/jpeg;base64,...", ... }]
```

`documentUrl` is the applicant's uploaded ID (Aadhaar/PAN). The Indian mobile space is enumerable — 10 digits with a known prefix set is a few hours of scripted requests. This is a bulk PII and identity-document breach with no authentication at all.

**Fix (minimum viable):** issue a short-lived signed lookup token at submission time and require it on read. Or send an OTP. At absolute minimum, strip `documentUrl` and `transactionId` from this response and rate-limit by IP:

```ts
const requests = await SeatRequest
  .find({ userPhone: phone })
  .select('seat status createdAt duration shift')   // no documentUrl, no transactionId
  .sort({ createdAt: -1 })
  .lean();
```

---

## 2. HIGH — Broken Colour Tokens (things are invisible right now)

I diffed every `var(--token)` used in `app/`, `components/`, `lib/`, `hooks/` against every token defined in `app/globals.css`. **13 colour tokens are referenced but never defined.** In CSS an undefined custom property makes the whole declaration invalid — the element renders with *no* background and *inherited* text colour.

| Undefined token | Used at | Visible result |
|---|---|---|
| `--ruby-50`, `--ruby-200`, `--ruby-800` | `SeatTile.tsx:23` | **Expired seats have no red tint and no red text.** Indistinguishable from active |
| `--marigold-50`, `--marigold-200`, `--marigold-800` | `SeatTile.tsx:24` | **Fee-due seats have no amber tint.** Indistinguishable from active |
| `--emerald-50` | `SeatTile.tsx:21`, `SeatMap.tsx:75` | Hover state and plant markers render transparent |
| `--emerald-50/200/700` | `SeatGridContent.tsx:193` | "Active" legend chip is unstyled |
| `--marigold-50/200/700` | `SeatGridContent.tsx:200` | "Due" legend chip is unstyled |
| `--ruby-50/200/700` | `SeatGridContent.tsx:208`, `SeatTile.tsx:166` | "Expired" legend chip + overdue day-count unstyled |
| `--ruby-600` | `export/page.tsx:265` | Danger button has no hover state |
| `--weight-extrabold` | `members/page.tsx:84` | Page heading renders at default weight |

**This is the single highest-impact visual bug in the app.** The seat map is the product, and its two most urgent states — expired and fee-due — currently have no colour at all. Note that `lib/utils.ts:104` (`STATUS_COLORS`) *does* contain correct, properly-contrasting light values (8:1 text-on-fill) but nothing imports it for the tile. The data exists; the wiring is missing.

**Fix:** add the missing ramp steps in §3 below, which defines all of them.

---

## 3. Colour Contrast — Measured Results & Replacement Palette

### 3.1 What is actually failing

Computed WCAG 2.1 relative-luminance ratios against the real backgrounds used in the code:

| Combination | Ratio | AA text (4.5) | AA UI (3.0) |
|---|---|---|---|
| `--text-primary` #0F172A on white | 17.85 | PASS | PASS |
| `--text-secondary` #475569 on white | 7.58 | PASS | PASS |
| `--text-tertiary` #64748B on white | 4.76 | PASS (barely) | PASS |
| `--text-tertiary` #64748B on `--bg-void` / `--bg-muted` | **4.34** | **FAIL** | PASS |
| `--text-disabled` #94A3B8 on white | 2.56 | **FAIL** | **FAIL** |
| `--text-link` / `--text-accent` #E8853A on white | **2.68** | **FAIL** | **FAIL** |
| **White text on `--saffron-500` primary button** | **2.68** | **FAIL** | **FAIL** |
| `--emerald-500` on white | 2.31 | **FAIL** | **FAIL** |
| `--amber-500` on white | 2.19 | **FAIL** | **FAIL** |
| `--marigold-500` on white | 1.92 | **FAIL** | **FAIL** |
| `--sapphire-500` on white | 2.79 | **FAIL** | **FAIL** |
| `--ruby-500` on white | 3.97 | **FAIL** | PASS |
| `--indigo-500` on white | 4.47 | **FAIL** (marginal) | PASS |
| `--border-default` #E2E8F0 vs white | 1.23 | — | **FAIL** |
| `--border-strong` #CBD5E1 vs white | 1.48 | — | **FAIL** |

**Every `Badge` variant fails**, because `components/ui/Badge.tsx:13-21` pairs a 20 %-opacity tint with the `-400` (brightest) text shade:

| Badge | Effective bg | Text | Ratio |
|---|---|---|---|
| `active` | `#D3F3E1` | `#34D97B` | **1.56** |
| `expiring` | `#FAECCE` | `#FBBD2C` | **1.45** |
| `due` | `#FAE7D8` | `#F59A3C` | **1.83** |
| `vacant` | `#D8ECFF` | `#60B4FF` | **1.83** |
| `expired` | `#FAD9D9` | `#F26F6F` | **2.20** |
| `pending` | `#E5DFFD` | `#818CF8` | **2.32** |

1.45:1 is effectively unreadable. Same root cause in `Toast.tsx:22-25`, `Button.tsx:24/31`, `Sidebar.tsx:96/113/125`, `TopBar.tsx:31`, `StatCard.tsx:44-48`.

Note also that `--text-tertiary` only clears AA against pure white. Against `--bg-void` and `--bg-muted` it drops to 4.34:1 — and that is where most of its real usages sit (`Sidebar.tsx:87/136`, `StatCard.tsx:85`, `SeatTile.tsx:187/194`, `AdminGuard.tsx:32`). The §3.2 value (#6B6660) holds 5.17:1 on the darkest surface.

**The pattern:** the `-400` and `-500` shades are correct for a dark surface, where light text on dark ground gives contrast. On white they are the *wrong end of the ramp*. The theme was inverted at the background layer but never at the accent layer.

### 3.2 Replacement palette — "Gangaur Light"

Warm-neutral ground (saffron is a warm hue; cool slate greys fight it), saffron/marigold brand preserved, every value verified. Drop-in replacement for the `:root` block of `app/globals.css`:

```css
:root {
  /* ── SURFACES ─────────────────────────────────────────── */
  --bg-void:       #F6F4F0;   /* page backdrop, warm paper   */
  --bg-base:       #FBFAF8;   /* app canvas                  */
  --bg-surface:    #FFFFFF;   /* cards, sheets               */
  --bg-elevated:   #FFFFFF;   /* modals, popovers            */
  --bg-muted:      #F2EFEA;   /* inset wells, table stripes  */
  --bg-overlay:    #E7E2DA;   /* scrollbar thumb, dividers   */
  --bg-glass:      rgba(255,255,255,0.92);

  /* ── BORDERS ──────────────────────────────────────────── */
  --border-subtle:  #EFEBE4;  /* decorative only             */
  --border-default: #DFD9D0;  /* card & panel edges          */
  --border-strong:  #948C82;  /* 3.32:1 — inputs, focusable  */

  /* ── TEXT — all AA-verified ───────────────────────────── */
  --text-primary:   #1C1917;  /* 17.49:1 on white            */
  --text-secondary: #57534E;  /*  7.63:1                     */
  --text-tertiary:  #6B6660;  /*  5.68:1  (was 4.76 — tight) */
  --text-disabled:  #8A837C;  /*  3.74:1  (was 2.56)         */
  --text-inverse:   #FFFFFF;
  --text-accent:    #A65310;  /*  5.43:1  (was 2.68 — FAIL)  */
  --text-link:      #A65310;  /*  5.43:1                     */

  /* ── SAFFRON — brand ramp, full 50→900 ───────────────── */
  --saffron-50:  #FFF7ED;
  --saffron-100: #FFEDD5;
  --saffron-200: #FCD9AE;   /* tile borders                  */
  --saffron-300: #F5B871;
  --saffron-400: #E89A3C;   /* FILL ONLY — never text        */
  --saffron-500: #C86A12;   /* 3.80:1 — large text / icons   */
  --saffron-600: #A65310;   /* 5.43:1 — TEXT + button fill   */
  --saffron-700: #85410C;   /* 7.61:1 — text on tint         */
  --saffron-800: #5E2E08;
  --saffron-900: #3B1D05;

  /* ── MARIGOLD — "fee due" ────────────────────────────── */
  --marigold-50:  #FEF9E7;
  --marigold-200: #FCE9A8;
  --marigold-400: #E5A716;   /* fill only                    */
  --marigold-500: #C98A0B;
  --marigold-600: #A16207;   /* 4.92:1 text                  */
  --marigold-700: #854D0E;   /* 6.85:1 text                  */
  --marigold-800: #5C340A;   /* 6.15:1 on marigold-50        */

  /* ── EMERALD — "active" ──────────────────────────────── */
  --emerald-50:  #ECFDF5;
  --emerald-200: #A7E9C4;
  --emerald-400: #34C77E;   /* fill only                     */
  --emerald-500: #16A34A;   /* 3.30:1 — dots, rings, borders */
  --emerald-600: #15803D;   /* 5.02:1 — TEXT                 */
  --emerald-700: #14652F;

  /* ── RUBY — "expired" / destructive ──────────────────── */
  --ruby-50:  #FEF2F2;
  --ruby-100: #FEE2E2;
  --ruby-200: #FCC5C5;
  --ruby-400: #EF5350;      /* fill only                     */
  --ruby-500: #DC2626;      /* 4.83:1 — dots, borders        */
  --ruby-600: #B91C1C;      /* 6.47:1 — TEXT + button fill   */
  --ruby-700: #991B1B;
  --ruby-800: #7F1D1D;      /* text on ruby-50               */

  /* ── SAPPHIRE — "vacant" / info ──────────────────────── */
  --sapphire-50:  #E0F2FE;
  --sapphire-200: #A9D8F5;
  --sapphire-400: #38A3E0;  /* fill only                     */
  --sapphire-500: #0284C7;  /* 4.10:1 — dots, borders        */
  --sapphire-600: #0369A1;  /* 5.93:1 — TEXT                 */

  /* ── INDIGO — "pending" ──────────────────────────────── */
  --indigo-50:  #EEF2FF;
  --indigo-400: #6366F1;    /* fill only                     */
  --indigo-500: #4F46E5;
  --indigo-600: #4338CA;    /* 7.20:1 — TEXT                 */

  /* Aliases the old code still references */
  --amber-400: var(--marigold-400);
  --amber-500: var(--marigold-500);
  --rose-500:  var(--ruby-500);
  --weight-extrabold: 800;

  /* ── GRADIENTS ───────────────────────────────────────── */
  --gradient-primary: linear-gradient(135deg, #C86A12 0%, #E5A716 100%);
  --gradient-glow:    linear-gradient(135deg, #A65310 0%, #85410C 100%);
  --gradient-surface: linear-gradient(160deg, #FFFFFF 0%, #FBFAF8 100%);
  --gradient-header-title: linear-gradient(to bottom, #1C1917, #44403C);
  --gradient-header-tag:   linear-gradient(to right, #C86A12, #A65310);

  /* ── SHADOWS — warm-tinted to match ground ───────────── */
  --shadow-xs: 0 1px 2px 0 rgba(28,25,23,0.05);
  --shadow-sm: 0 1px 3px 0 rgba(28,25,23,0.10), 0 1px 2px -1px rgba(28,25,23,0.10);
  --shadow-md: 0 4px 6px -1px rgba(28,25,23,0.10), 0 2px 4px -2px rgba(28,25,23,0.08);
  --shadow-lg: 0 10px 15px -3px rgba(28,25,23,0.10), 0 4px 6px -4px rgba(28,25,23,0.08);
  --shadow-xl: 0 20px 25px -5px rgba(28,25,23,0.10), 0 8px 10px -6px rgba(28,25,23,0.08);
  --shadow-floating: 0 10px 40px -10px rgba(28,25,23,0.15);

  /* keep all existing --space-*, --radius-*, --text-*,
     --leading-*, --tracking-*, --weight-*, --ease-*,
     --duration-*, --z-* — those are fine as-is */
}
```

### 3.3 The one rule that prevents this recurring

> **`-400` is a fill. `-600` is text. Never swap them.**
>
> - `-50` / `-100` — tint backgrounds
> - `-200` — tint borders
> - `-400` — solid fills, dots, progress rings (large shapes only, ≥3:1)
> - `-500` — icons, 1 px borders, large text ≥24 px
> - `-600` / `-700` — **all body text, all labels, all badge text**

Codify it as a comment at the top of the palette block so the next edit does not regress.

### 3.4 Required component edits

**`components/ui/Badge.tsx`** — replace the config table (fixes all 6 failures, and removes the emoji icons):

```tsx
const badgeConfig: Record<BadgeVariant, { bg: string; border: string; text: string; defaultLabel: string }> = {
  active:   { bg: 'bg-[var(--emerald-50)]',  border: 'border-[var(--emerald-200)]',  text: 'text-[var(--emerald-600)]',  defaultLabel: 'Active' },
  expired:  { bg: 'bg-[var(--ruby-50)]',     border: 'border-[var(--ruby-200)]',     text: 'text-[var(--ruby-600)]',     defaultLabel: 'Expired' },
  expiring: { bg: 'bg-[var(--marigold-50)]', border: 'border-[var(--marigold-200)]', text: 'text-[var(--marigold-700)]', defaultLabel: 'Expiring Soon' },
  due:      { bg: 'bg-[var(--saffron-50)]',  border: 'border-[var(--saffron-200)]',  text: 'text-[var(--saffron-700)]',  defaultLabel: 'Fee Due' },
  vacant:   { bg: 'bg-[var(--sapphire-50)]', border: 'border-[var(--sapphire-200)]', text: 'text-[var(--sapphire-600)]', defaultLabel: 'Vacant' },
  pending:  { bg: 'bg-[var(--indigo-50)]',   border: 'border-[var(--indigo-400)]/30',text: 'text-[var(--indigo-600)]',   defaultLabel: 'Pending' },
  morning:  { bg: 'bg-[var(--marigold-50)]', border: 'border-[var(--marigold-200)]', text: 'text-[var(--marigold-700)]', defaultLabel: 'Morning' },
  evening:  { bg: 'bg-[var(--indigo-50)]',   border: 'border-[var(--indigo-400)]/30',text: 'text-[var(--indigo-600)]',   defaultLabel: 'Evening' },
  full:     { bg: 'bg-[var(--saffron-50)]',  border: 'border-[var(--saffron-200)]',  text: 'text-[var(--saffron-700)]',  defaultLabel: 'Full Day' },
};
```

Pair the shift labels with `<Sun/>` / `<Moon/>` from `lucide-react` — the app already uses those exact icons in `SeatTile.tsx:33-42`, so the emoji are inconsistent as well as inaccessible (screen readers announce "🌅" as "sunrise over mountains").

**`components/ui/Button.tsx`** — three variants fail:

```tsx
primary:   bg-[var(--saffron-600)] text-white   // 5.43:1 (was 2.68:1)
           hover:bg-[var(--saffron-700)]
secondary: text-[var(--saffron-700)]            // was --saffron-400 @ 2.19:1
           border-[var(--border-strong)]
danger:    bg-[var(--ruby-50)] text-[var(--ruby-600)]   // was --ruby-400 @ 2.89:1
           border-[var(--ruby-200)]
```

Also: `baseClasses` references `focus-visible:ring-saffron-500`, a Tailwind class that resolves through `@theme inline` — verify it emits; the arbitrary-value form `focus-visible:ring-[var(--saffron-600)]` is safer.

**`components/ui/Toast.tsx:22-25`** — switch `text-[var(--*-400)]` → `text-[var(--*-600)]`. The icon is the only coloured element (the message text already uses `--text-primary`), so it needs 3:1 minimum; `-600` gives 5:1+.

**`components/layout/Sidebar.tsx:96,113,125` + `TopBar.tsx:31`** — the `bg-[color]/10 text-[color]` chip pattern measures 2.39–2.48:1. Use `bg-[var(--sapphire-50)] text-[var(--sapphire-600)]`.

**`components/ui/StatCard.tsx:44-48`** — same fix; `-500` → `-600` for the `text` half of each accent token.

**`components/seat/SeatTile.tsx:20-26`** — with §3.2 applied, the missing tokens resolve and the tiles work. Additionally `text-[var(--ruby-700)]` at line 166 and `--saffron-700` at 163 now render.

---

## 4. Light Theme Completeness

### 4.1 The landing page is entirely dark

`app/landing/page.tsx` — 858 lines, of which **508 are an inline `<style>` block** hardcoding a dark theme:

```css
.lp-root { background: #080604; color: #ede0ca; }
```

Every user's first screen — and the only route an unauthenticated visitor can reach (`AppShell.tsx:39-41` redirects everything else to `/landing`) — is dark. The "light theme only" requirement is broken at the front door.

Three problems beyond the colour:
1. **`@import url('https://fonts.googleapis.com/...')` inside the style block** (line ~106). This is a render-blocking request that Next cannot preload, defeats the `next/font` optimisation already configured in `layout.tsx:7-18`, and loads two font families (Cormorant Garamond, DM Sans) that no other page uses.
2. **~40 hardcoded hex values** (`#b8760e`, `#ede0ca`, `#d18f26`…) with zero token references — the page cannot follow any theme change.
3. **Admin login is hidden behind a triple-click on the logo** (`page.tsx:32-40`). Undiscoverable by design, and completely inaccessible via keyboard or screen reader.

**Fix:** rewrite against the tokens. `#b8760e` → `--saffron-600` (`#A65310`), background → `--bg-void`, body text → `--text-secondary`. Move fonts into `layout.tsx` via `next/font/google` alongside Outfit. Replace the triple-click with a visible "Staff login" link in the footer.

### 4.2 Theme colour conflicts

| Source | Value |
|---|---|
| `app/layout.tsx:36` `themeColor` | `#F8FAFC` (light) |
| `public/manifest.json` `theme_color` | `#1a1a16` (**dark** — leftover) |
| `public/manifest.json` `background_color` | `#f5f3eb` (cream — matches nothing) |

The installed PWA renders a dark status bar over a light app. Set all three to `#FBFAF8` (`--bg-base`). Also `layout.tsx:27` sets `statusBarStyle: "black-translucent"` — should be `"default"` for a light app.

### 4.3 Dead dark-mode scaffolding

`hooks/useDarkMode.ts` hardcodes `isDark = true` and its `toggle()` only `console.log`s. Nothing imports it. `grep "dark:"` across the codebase returns **0 matches**, so the file is entirely vestigial. Delete it.

### 4.4 Design-system docs are stale

`GANGAUR_LIBRARY_DESIGN_SYSTEM.md` and `FRONTEND_UI_DESIGN.md` predate the light conversion and describe the dark palette. Either update them to §3.2 or delete them — stale design docs actively cause regressions when someone follows them.

---

## 5. Architecture Findings

### 5.1 Two auth systems, one of them dead

| File | Mechanism | Used by |
|---|---|---|
| `hooks/useAuth.tsx` | Role in `localStorage`, hydrates client-side | **All 26 components** |
| `contexts/AuthContext.tsx` | Server check via `GET /api/auth/check` | **Nothing** |

`contexts/AuthContext.tsx` is dead code that duplicates the live implementation with *better* semantics (server-verified rather than localStorage-trusted). Meanwhile `/api/auth/check` exists solely to serve the dead consumer.

The live path means `isAdmin` is a client-side claim: `localStorage.setItem('library-role','admin')` in devtools reveals the entire admin UI. The server routes do enforce properly via `verifyAdmin()`, so no data leaks — but the user sees a fully populated admin shell whose every action 401s. That is a confusing failure mode, not a security boundary.

**Fix:** delete `contexts/AuthContext.tsx`, and have `hooks/useAuth.tsx` derive `isAdmin` from `GET /api/auth/check` (SWR) rather than `localStorage`. Keep `localStorage` only for the `user` role, which carries no privilege.

### 5.2 No server-side route protection

There is no `middleware.ts`. Admin gating is 100 % client-side (`AppShell.tsx:37-49`, `AdminGuard.tsx:16-22`), which means:

- Admin page HTML and JS bundles ship to every visitor
- A `useEffect` redirect always renders one frame first
- Direct navigation to `/members` briefly paints before bouncing

**Fix:** add `middleware.ts` reading the `admin_session` cookie and 302-ing unauthenticated requests off `/`, `/members`, `/analytics`, `/requests`, `/audit`, `/export`, `/attendance`, `/expiry`, `/setup`.

### 5.3 `GET /api/members` mutates the database

`app/api/members/route.ts:14-19` — a read endpoint that runs `insertMany` when the collection is empty. Two concurrent first-loads both see `length === 0`, both insert, and the second throws on the `seat` unique index → 500 on a cold start. `GET` must be idempotent.

**Fix:** move seeding to `scripts/seed.ts` run once at provisioning.

### 5.4 Service worker caches authenticated API responses

`public/sw.js:45-64` caches every same-origin `GET` with `status === 200`, which includes `/api/members` (full PII when admin), `/api/requests`, `/api/audit`, and `/api/auth/check`.

Consequences: an admin's full member list persists in `CacheStorage` after logout and is served to any subsequent user of that device while offline; and a cached `{"isAdmin":true}` from `/api/auth/check` can revive a stale admin state.

**Fix:**

```js
if (url.pathname.startsWith('/api/')) return;   // never cache API
```

Also bump `CACHE_NAME` to `v2` so existing poisoned caches are purged by the `activate` handler.

### 5.5 Layer boundaries

`lib/utils.ts` mixes date maths, status derivation, colour tables (`STATUS_COLORS`), and `cn()`. The colour table in particular is presentation data living in a shared util — and it duplicates, with different values, what `SeatTile.tsx` does inline. Split into `lib/date.ts`, `lib/seat-status.ts`, `lib/cn.ts`, and delete `STATUS_COLORS` in favour of the tokens.

---

## 6. Database Findings

### 6.1 Lost-update race on attendance

`app/api/attendance/route.ts:61-76` is a read-modify-write:

```ts
const doc = await Attendance.findOne({ date });
let seats = doc ? doc.seats : [];
if (present) { if (!seats.includes(seat)) seats.push(seat); }
await Attendance.findOneAndUpdate({ date }, { date, seats }, { upsert: true });
```

Two staff marking attendance on two devices at the same moment: both read `[1,2]`, one writes `[1,2,3]`, the other writes `[1,2,4]`. Seat 3 is silently lost. With the kiosk flow this is a routine occurrence, not an edge case.

**Fix:** one atomic operator, no read:

```ts
await Attendance.updateOne(
  { date },
  present ? { $addToSet: { seats: seat } } : { $pull: { seats: seat } },
  { upsert: true }
);
```

### 6.2 TOCTOU race on seat allotment

`app/api/members/[seat]/route.ts:23-34` checks `!current.vacant`, then updates in a separate call. Two admins allotting the same seat concurrently both pass the check; the second silently overwrites the first member's record.

**Fix:** make the check part of the write filter:

```ts
const updated = await Member.findOneAndUpdate(
  { seat: seatId, vacant: true },   // atomic guard
  { $set: body },
  { new: true }
);
if (!updated) return NextResponse.json({ error: 'Seat is occupied' }, { status: 409 });
```

### 6.3 `upsert: true` on an unvalidated path parameter

Same file, line 33. `seat` is `parseInt(seat, 10)` with no validation, and `upsert: true` **creates** whatever it does not find. `PATCH /api/members/9999` inserts a seat-9999 document into a fixed 95-seat library. `PATCH /api/members/abc` yields `NaN` → Mongoose CastError → 500 instead of 400.

**Fix:**

```ts
const seatId = Number(seat);
if (!Number.isInteger(seatId) || seatId < 1 || seatId > 95) {
  return NextResponse.json({ error: 'Invalid seat number' }, { status: 400 });
}
```

Drop `upsert: true` — the 95 seats are seeded once and never created ad hoc.

### 6.4 `$set: body` with no allow-list

Line 32 spreads the raw request body straight into `$set`. Mongoose `strict: true` (the default) drops unknown paths, so this is not currently exploitable — but it means a client can set *any* schema field, including `vacant`, `fee`, and `expiry`, bypassing the business rules the UI enforces. Validate with Zod (already a dependency, already used in `AddMemberForm.tsx`) and `$set` only the parsed result.

### 6.5 Base64 ID documents stored inline

`models/SeatRequest.ts:28` — `documentUrl: String` holds a full `data:image/jpeg;base64,…` payload.

- The 2 MB limit exists **only client-side** (`SeatRequestSheet.tsx:91`). `POST /api/requests` is public and unauthenticated with no body-size check — anyone can push multi-MB blobs until the DB fills, or exceed Mongo's 16 MB document ceiling and get a 500.
- Base64 inflates every image ~33 %.
- `GET /api/requests` returns *all* requests with *all* documents — one admin page load can transfer tens of MB.
- Government ID images sit unencrypted in the primary collection with no retention policy.

**Fix:** upload to object storage (S3/R2/Vercel Blob), store the key, serve via short-lived signed URLs. Enforce the size limit server-side. Add a retention job that purges documents 30 days after a request is approved or rejected.

### 6.6 Index issues

| Model | Issue |
|---|---|
| `Attendance.ts:9,16` | `unique: true` already creates an index; the explicit `.index({date:1})` on line 16 is a **duplicate** — remove it |
| `AuditLog.ts` | Sorted by `timestamp` in `/api/audit:17` with **no index** on it |
| `AuditLog.ts` | **Unbounded growth** — every seat edit, fee change, and attendance mark appends a row forever, and only the last 100 are ever read |
| `Member.ts` | `/api/cron/reminders:28-31` filters on `vacant` + `expiry`; no compound index |

```ts
// AuditLog.ts — index + 180-day TTL
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

// Member.ts
MemberSchema.index({ vacant: 1, expiry: 1 });
```

### 6.7 Schema types too loose

`models/Member.ts:13-16` — `duration`, `fee`, and `shift` are bare `String` with no `enum`, while `lib/types.ts:2-4` defines exact unions and `SeatRequest.ts:24-29` correctly uses `enum`. The database will happily store `fee: 'banana'`. Mirror the unions:

```ts
duration: { type: String, enum: ['1M','3M','6M','1Y',''], default: '' },
fee:      { type: String, enum: ['paid','due',''],        default: '' },
shift:    { type: String, enum: ['morning','evening','full'], default: 'morning' },
```

### 6.8 Connection pool unconfigured

`lib/mongodb.ts:26` passes only `bufferCommands: false`. In a serverless deployment each cold instance opens its own pool; with no `maxPoolSize` you will exhaust Atlas connection limits under load. Add:

```ts
const opts = {
  bufferCommands: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};
```

Also: the fallback to `mongodb://localhost:27017` (line 3) means a missing `MONGODB_URI` in production silently connects to nothing and fails at query time with an opaque error, rather than failing loudly at boot.

---

## 7. Fifty Suggestions

### UI / UX — 25

| # | Priority | Suggestion |
|---|---|---|
| 1 | **P0** | Define the 13 missing colour tokens (§2). Expired and fee-due seats currently render with no colour — the seat map's core signal is invisible |
| 2 | **P0** | Replace the `:root` palette with §3.2. This alone fixes 24 failing contrast pairs |
| 3 | **P0** | Fix `Badge.tsx` — all 6 variants sit between 1.45:1 and 2.32:1. Use `-50` tint + `-600` text |
| 4 | **P0** | Fix the primary button: white on `--saffron-500` is **2.68:1**. Move to `--saffron-600` for 5.43:1 |
| 5 | **P0** | Convert `app/landing/page.tsx` off its 508-line dark inline `<style>` to design tokens |
| 6 | **P1** | Change `--text-link` / `--text-accent` from `#E8853A` (2.68:1) to `#A65310` (5.43:1) |
| 7 | **P1** | Move the landing page's Google Fonts `@import` into `next/font/google` in `layout.tsx` — it is render-blocking and bypasses font optimisation |
| 8 | **P1** | Replace the triple-click-logo admin login (`landing/page.tsx:32-40`) with a visible, keyboard-reachable "Staff login" link |
| 9 | **P1** | Reconcile `manifest.json` `theme_color` (`#1a1a16`, dark) with `layout.tsx` `themeColor` (`#F8FAFC`). Set both to `#FBFAF8` |
| 10 | **P1** | Change `appleWebApp.statusBarStyle` from `"black-translucent"` to `"default"` — it is a light app |
| 11 | **P1** | Remove the 3 emoji used as icons in `Badge.tsx:19-21` (🌅 🌙 ☀️). Use the `Sun`/`Moon` lucide icons the app already uses in `SeatTile.tsx` |
| 12 | **P1** | Add `app/error.tsx`, `app/loading.tsx`, and `app/not-found.tsx` — none exist, so any render error shows the raw Next.js error overlay |
| 13 | **P1** | `--border-default` (#E2E8F0) is 1.23:1 against white. Interactive borders need ≥3:1 — use `--border-strong` #948C82 (3.32:1) on inputs and focusable elements |
| 14 | **P1** | `SeatTile.tsx:139` fetches a DiceBear avatar per seat — 95 third-party requests per map render, on the critical path, with `member.name` in the query string (see #38). Generate initials-based avatars locally instead |
| 15 | **P1** | `useMembers` uses `getDefaultMembers()` (95 vacant seats) as SWR `fallbackData`. Every load flashes "all seats free" before real data arrives. Use `<Skeleton>` — the component already exists |
| 16 | **P2** | `--text-disabled` #94A3B8 is 2.56:1. Disabled controls are WCAG-exempt but this is unreadable; #8A837C gives 3.74:1 |
| 17 | **P2** | `next/image` is never used; `SeatTile.tsx:138` triggers the eslint `no-img-element` warning. Two of the app's three PNGs are >600 KB |
| 18 | **P2** | Delete 2.3 MB of unreferenced assets: `royal-library-bg.png` (672 KB), `assets/desk.png` (671 KB), `assets/plant.png` (631 KB). `grep` finds zero references |
| 19 | **P2** | `icon-512.png` is 319 KB for a 512×512 icon. Should be ~20 KB — run it through `oxipng`/`squoosh` |
| 20 | **P2** | 82 of 83 `<button>` elements lack `aria-label`. Icon-only buttons (`Toast.tsx:59`, `requests/page.tsx:281`) are unusable with a screen reader |
| 21 | **P2** | 3 `<div onClick>` handlers exist with no `role="button"`, `tabIndex`, or key handler — unreachable by keyboard |
| 22 | **P2** | `AuthModal.tsx` has no focus trap, no `role="dialog"`, no `aria-modal`, and no Escape handler. `SeatRequestSheet.tsx:70-77` implements Escape correctly — apply the same pattern |
| 23 | **P2** | `Toast.tsx` uses `role="alert"` on each toast but the container has no `aria-live` region, so toasts appearing after page load may not be announced |
| 24 | **P3** | `--text-xs` is `0.64rem` ≈ 10.2 px. Combined with `tracking-widest` + `uppercase` in `Badge`, this is below the 12 px floor for comfortable reading. Raise the bottom of the type scale to `0.75rem` |
| 25 | **P3** | 60 of ~120 defined tokens are never referenced (whole `@theme inline` colour block, all `--gradient-*`, all `--duration-*`). Prune — dead tokens are what let #1 happen unnoticed |

### Backend / Database / Architecture — 25

| # | Priority | Suggestion |
|---|---|---|
| 26 | **P0** | **Remove the `ADMIN_SECRET` fallback** (`auth-server.ts:4`). It is currently unset, so all sessions are signed with a string published in the repo — anyone can forge an admin cookie |
| 27 | **P0** | **Delete `app/api/debug/seed/route.ts`.** Unauthenticated `GET` that runs `Member.deleteMany({})` — one URL wipes the database |
| 28 | **P0** | **Lock down `GET /api/requests/my?phone=`.** Public, unauthenticated, returns full PII including base64 ID documents, keyed on an enumerable 10-digit phone number |
| 29 | **P0** | Add real rate limiting to `POST /api/auth`. The 2-second `setTimeout` (`auth/route.ts:26`) delays each response but does nothing against concurrency — 10,000 parallel requests crack a 4-digit PIN in seconds |
| 30 | **P0** | Stop the service worker caching `/api/*` (`sw.js:45`). It persists admin PII in `CacheStorage` across logout and can revive a stale `{"isAdmin":true}` |
| 31 | **P1** | Fix the attendance lost-update race — replace read-modify-write with `$addToSet` / `$pull` (§6.1) |
| 32 | **P1** | Fix the seat-allotment TOCTOU — put `vacant: true` in the update filter instead of a separate check (§6.2) |
| 33 | **P1** | Validate `[seat]` as an integer in 1–95 and drop `upsert: true` — `PATCH /api/members/9999` currently creates a phantom seat |
| 34 | **P1** | Hash the admin PIN (bcrypt/argon2) instead of storing it plaintext in `.admin-pin.json`, and compare in constant time |
| 35 | **P1** | Replace `lib/pin-store.ts` filesystem storage. `process.cwd()` is read-only on Vercel and ephemeral everywhere else — the PIN silently reverts to `process.env.ADMIN_PIN` (or the hardcoded `'123456'`) on every deploy |
| 36 | **P1** | Enforce the 2 MB upload limit **server-side**. It exists only in `SeatRequestSheet.tsx:91`; the public `POST /api/requests` accepts arbitrary-size base64 |
| 37 | **P1** | Move ID documents out of MongoDB to object storage with signed URLs and a retention policy (§6.5) |
| 38 | **P1** | Stop sending member names to `api.dicebear.com`. `SeatTile.tsx:139` puts `member.name + seat` in a third-party query string — an unnecessary PII disclosure on every render |
| 39 | **P1** | Add `middleware.ts` for server-side route protection. Admin gating is entirely client-side today (§5.2) |
| 40 | **P1** | Escape CSV output in `export/page.tsx:91`. Embedded `"` breaks the row, and a name beginning `=`, `+`, `-`, or `@` executes as a formula in Excel — and names come from *public* seat-request submissions |
| 41 | **P1** | Validate every API body with Zod. `zod` is already a dependency and already used in two form components — the API layer has only ad-hoc `if (!data.seat)` checks |
| 42 | **P1** | Validate `data.seat` in `POST /api/requests` as an integer in 1–95 — it is currently unbounded |
| 43 | **P2** | Delete the dead `contexts/AuthContext.tsx` (0 importers) and derive `isAdmin` from the server rather than `localStorage` (§5.1) |
| 44 | **P2** | Move seeding out of `GET /api/members` into a `scripts/seed.ts`. A read endpoint that writes is both non-idempotent and racy on cold start (§5.3) |
| 45 | **P2** | Add `enum` constraints to `Member` schema `duration`/`fee`/`shift` — `lib/types.ts` defines the unions but the DB accepts anything (§6.7) |
| 46 | **P2** | Add `maxPoolSize`, `serverSelectionTimeoutMS`, `socketTimeoutMS` to the Mongoose connect options, and fail loudly on a missing `MONGODB_URI` instead of falling back to localhost (§6.8) |
| 47 | **P2** | Index `AuditLog.timestamp` and add a 180-day TTL. It is sorted on an unindexed field and grows forever while only 100 rows are ever read (§6.6) |
| 48 | **P2** | Remove the duplicate index on `Attendance.date` — `unique: true` already creates one |
| 49 | **P2** | Remove 8 unused dependencies: `@avatune/micah-theme`, `@avatune/react`, `recharts`, `react-zoom-pan-pinch`, and 4 `@radix-ui` packages. Confirmed 0 references each; `recharts` alone is ~500 KB |
| 50 | **P2** | Add tests. There are none. Start with the pure functions that carry real money and date logic: `calcExpiry`, `daysUntilExpiry`, `getSeatStatus`, and the CSV escaping from #40 |

---

## 8. Suggested Sequence

**Week 1 — stop the bleeding**
#26, #27, #28, #29, #30 (security), then #1, #2, #3, #4 (the seat map is unreadable).

**Week 2 — correctness**
#31, #32, #33 (data races), #36, #37, #40 (data integrity + PII), #12 (error boundaries).

**Week 3 — the light theme**
#5, #6, #7, #8, #9, #10, #11, #13 — the landing page rewrite is the bulk of the work.

**Week 4 — cleanup**
#39, #43, #44, #45, #46, #47, #48, #49, #50 and the remaining P2/P3 items.

---

## 9. Verification

After the palette change, re-run the contrast check:

```bash
# every text/background pair in the new palette must clear 4.5:1
python3 scripts/check-contrast.py
```

And re-run the token diff to confirm nothing is referenced-but-undefined:

```bash
grep -ohrE "var\(--[a-z0-9-]+\)" app components lib hooks \
  | sed -E 's/var\((--[a-z0-9-]+)\)/\1/' | sort -u > /tmp/used.txt
grep -oE "^\s+(--[a-z0-9-]+):" app/globals.css \
  | tr -d ': ' | sort -u > /tmp/defined.txt
comm -23 /tmp/used.txt /tmp/defined.txt   # must be empty
```

Wire that second command into CI. It would have caught §2 the day it was introduced.
