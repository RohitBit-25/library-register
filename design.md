# Design — Shree Gangaur Study Library

A locked design system for this app. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

Two audiences, one system:

- **Students** (public: `/landing`, `/browse`, `/my-requests`, `/kiosk`) — arrive
  from a QR code on a phone, want to see a free seat and request it.
- **Front-desk staff** (admin: everything else) — on a laptop at the desk or a
  phone in the hall, allotting seats, collecting fees, chasing renewals.

## Genre
Modern-minimal — crisp product UI (the Linear / Stripe / Notion register),
chosen by the owner on 2026-10-24 over an earlier editorial pass that read as
dull. White surfaces on a cool grey page, near-black ink, one family, soft
layered shadows, saffron kept for brand moments.

## Student pages: pixel identity (2026-10-25)
The owner rejected the SaaS and warm versions as generic and chose **their own
pixel-art kit**. It now covers every student page — `/landing`, `/browse`
(and its request form), `/my-requests`, `/kiosk` — through shared pieces:
`UnifiedHeader` (name plate), `PublicFooter`, `PixelButton`
(`components/pixel/`), and `Segmented pixel`. The staff side keeps the crisp
system; its active sidebar item carries a saffron edge. The art lives in
`public/landing/` (`hall.png`, `student.png`, `desk.png`, `desks-row.png`;
originals kept at the repo root).

**Text is never pixelated.** A pixel font (Pixelify Sans) was tried and removed
on the owner's request (2026-10-25): its 5 read as S, so "Desk 5" looked like
"Desk S". All text is Geist — headings `font-display` bold with
`tracking-tight` at large sizes, sentence case (all-caps only on small labels
and badges). The pixel look lives in the art and the frames, not the letters.
Surfaces are cream (`--warm-*`) with hard
pixel boxes: `.px-box` (4px ink frame), `.px-raised` (frame + hard offset shadow),
`.px-btn` (presses down on :active), `.px-planks` (wood floor under the art);
colours come from `--px-*` tokens (wood, navy badge, green bullets, dark HUD
chip). No rounded corners, no gradients, no soft shadows on these pages. Voice is
short and bilingual (Hindi speech bubble on the student). Seat counts and per-day
fees are computed, never typed. Real-world details (phone, WhatsApp,
address/map, reviews, photos) live in `lib/siteInfo.ts` / `lib/photos.ts` and
their sections stay hidden until filled.

## Landing: Royal crest (restored 2026-10-30)
History, so it isn't repeated: the first crest version had a tilted stack of
cards (pixel art + emblem) and a floating chip in the hero; the owner said it
looked AI-generated. A "Print" broadsheet replaced it the same day, and the
owner asked for the navy-and-gold crest back, improved. What changed: the
tilted cards and the glossy 3D desk render are gone; the imagery is four
risograph-style prints made for the page (`public/landing/print/`:
hall-morning, hall-night, desk, rajsamand-lake — Higgsfield Z Image; captions
never claim they are photos of the actual hall).

- **Colour:** navy `#0B2141` / navy-deep, gold-light `#E3B455` (fills and
  type on navy only), gold `#A86F1C` / gold-deep for small text on cream,
  cream `#FFFAF3`. `--crest-on-navy` / `-2` for text on navy.
- **Type:** Instrument Serif (`font-editorial`) for display and figures,
  Geist for text, Cinzel only in the emblem lockup (the emblem's name is typed
  — the artwork misspells it "Ganguar"). Brand Digits keeps "1" readable.
- **Devices:** island nav pill; double-bezel cards (`.bezel` / `.bezel-core`);
  pill buttons with the arrow in its own circle (`PillLink`); eyebrow pills;
  pointer spotlight rims on cards; one facility marquee under the hero.
- **Never:** tilted or stacked cards, floating chips over images, 3D/glossy
  renders next to the prints, purple gradients, invented numbers.
- **Motion:** fade-up reveals (`.reveal`), the live count runs up, the day bar
  fills, desks on the live map light from the entrance, pixel step scenes play
  once (`steps()` easing). All off under reduced motion.

## Macrostructure family
- Marketing (`/landing`): **Crest** — island nav; editorial split hero on
  navy (headline, two pills, live count | one framed morning print, set
  straight); facility marquee; hall bento (night print, one desk, a day at
  Gangaur, in the hall, desk print, today's count); the real hall (`RealHall`:
  9:16 stills from the library's Instagram reels in a staggered filmstrip,
  swipeable on phones, then real Google review quotes); the live room map
  (`LiveHall`, real coordinates, gold = free); passes on navy with the
  best-value card in gold and an "every pass includes" strip; three pixel
  step scenes; lake print + visit card beside the FAQ; closing count; navy
  footer.
- Public app (`/browse`, `/my-requests`, `/kiosk`): the plan or form is the page.
- Admin: **Workbench** — page title + one line of context, then the working
  surface (plan, table, form). No hero, no enrichment.

## Theme
Hex, not OKLCH, on purpose: `scripts/check-contrast.py` parses `#rrggbb` from
`app/globals.css` and fails the build on any pair under AA.

| Role | Token | Value |
| --- | --- | --- |
| Page | `--bg-void` / `--bg-base` | `#F6F7F9` |
| Surface (cards, sheets) | `--bg-surface` | `#FFFFFF` |
| Inset / tracks | `--bg-muted` | `#F2F4F7` |
| Card edge | `--border-default` | `#E4E7EC` |
| Control edge (≥3:1) | `--border-strong` | `#7D8696` |
| Ink / primary button | `--ink`, `--text-primary` | `#101828` |
| Ink 2 | `--text-secondary` | `#475467` |
| Ink 3 | `--text-tertiary` | `#5E6778` |
| Brand accent | `--saffron-600` / `-700` | `#A65310` / `#85410C` |

Status ramps carry **status only**; their colours live in
`components/seat/statusStyle.ts` and nowhere else.

Saffron is the brand, not the button: the live/selected seat, "best value",
step numbers, the active nav icon, focus rings. The primary action is ink.

## Typography
- One family: **Geist** (400 / 500 / 600) for everything; **Geist Mono** for
  seat numbers, phone numbers and tabular figures. Never italic headings.
- No letter-spacing overrides (ui-skills baseline-ui): Geist's own spacing
  at every size. Headings `text-wrap: balance`, prose `pretty` (globals.css).
- Body 16px, dense UI 14px, nothing under 12px.
- Scale: 12 / 14 / 16 / 18 / 22 / 28 / 36 / 48 / 60 px (`--text-xs` … `--text-4xl`);
  landing headline 44–64px.
- **Tiro Devanagari Hindi** only where श्री गणगौर is shown.
- **Noto Sans Devanagari** sits after Geist in `--font-body`/`--font-display`
  so Hindi UI text renders in a matching sans.

## Language (2026-10-27)
- Student pages (landing, browse + request form, my-requests, kiosk) have a
  हिंदी / English toggle, named in the language it switches to. Staff pages
  stay English.
- Strings live in `lib/i18n.ts`, keyed by the English text; use `t()` from
  `hooks/useLang`. A missing entry shows English, never a key name.
- Placeholders (`{n}`, `{name}`) must survive translation — `npm test` checks.
- Plurals are separate keys (`… 1 day …` and `… {n} days …`), not string math.

## Spacing
4-point scale, `--space-1` (4px) … `--space-32` (128px). Use tokens or the
matching Tailwind step; no one-off pixel gaps.

## Shape & depth
- Radii: 6 · 8 · 10 · 12 · 16 · 20 · 24 (`--radius-xs` … `--radius-3xl`);
  Tailwind's `rounded-*` reads these.
- App buttons and inputs 8px; cards 12–16px; marketing cards 20–24px;
  marketing CTAs and the public nav are pills.
- Every card: white, 1px `--border-default`, `--shadow-xs`. Floating layers
  (sheets, popovers, the hero product card) step up to `--shadow-lg/xl`.

## Motion
- Easings: `--ease-out` cubic-bezier(0.23, 1, 0.32, 1), `--ease-in-out`
  cubic-bezier(0.77, 0, 0.175, 1), `--ease-drawer` for sheets.
- UI ≤ 220ms. One entrance per page at most. No hover lifts on non-interactive
  surfaces, no sheen sweeps, no bounce.
- Reduced motion: opacity only, ≤150ms (enforced in globals.css + MotionConfig).

## Microinteractions stance
- Silent success; toasts only for things that happened off-screen or can be
  undone.
- Destructive actions confirm; reversible ones offer Undo.
- Press feedback: `scale(0.97)` on buttons, nothing on cards.
- Focus ring appears instantly; it is never animated.

## CTA voice
- Primary: ink fill, white label, verb-first ("Find a free seat", "Allot seat").
- Secondary: white, `--border-default`, ink label.
- `brand` variant (saffron) only where the action is itself the brand moment.

## Floor plan
From the owner's seat-layout spec (2026-10-25). **95 seats, numbered 1–95.**
21 and 22 were missing from the spec; the owner placed them as a pair just
right of the entrance door. `SEAT_LAYOUT` in `lib/layoutConfig.ts` is the
single source of truth — the plan, validation (`seatNumber`), the members and
stats APIs, seeding and every "N seats" line derive from it.

| Group | Seats (reading order) | Chair |
| --- | --- | --- |
| Left wall | 95 → 85 (top to bottom) | right of desk |
| Column 2 | 79 → 71 | left of desk |
| Column 3 | pairs 70\|61 … 62\|53 | outer left / outer right (facing) |
| Column 4 | pairs 52\|42 … 43\|33 | outer left / outer right (facing) |
| Column 5 | pairs 32\|20 … 23\|11 | outer left / outer right (facing) |
| Right wall | 10 → 1 | left of desk |
| Bottom row | 84 → 80 (left to right) | behind (above) |
| By the door | 21, 22 (right of the door) | behind (above) |

- Canvas 1600 × 1200; desks 84 × 70 on an 80px row pitch. Two AC units on the
  top wall, the door on the bottom wall. Palette: floor `#F3EFE6`, desk
  `#DDB57A`, desk border `#A67C3E`, chair `#1F1F1F`, wall `#D0D0D0`, wall
  border `#888888`, door `#6B3E26`, handle `#C9A64A`.
- Paired tables (Columns 3–5) **face each other**: the left desk's chair on
  the outer left, the right desk's on the outer right. Column 2 chairs on the
  left; wall desks' chairs on the room side; the bottom row's behind it.
- Every chair is fully visible in its own space (`chairRect`), never under a
  desk or another chair — enforced by self-checks.
- A seat's state is a mat on the desk with the number. Public: Available
  green, Selected orange, Requested yellow (dashed), Booked red. Admin: the
  status colours from `statusStyle.ts`; vacant is bare wood.
- Canvas details: dark pills naming each group (LEFT WALL, COLUMN 2–5, RIGHT
  WALL, BOTTOM ROW), an ENTRANCE label at the door, oak grain on desks, soft
  floor shading at the walls.
- Interaction: desks lift 2px on hover (pointer devices only); the selected
  seat gets a saffron ring; drag to pan when the plan overflows its box (a
  drag never opens a seat); a seat picked from search or a `?seat=` link
  scrolls into view with 32px margin; the student plan has a hover tooltip
  (seat · group · state); legends show live counts.
- Hover cards/tooltips inside the plan counter-scale via `--plan-scale`, so
  they read at true size at any zoom.
- The database rows for 21 and 22 (kept from the old layout) are live seats
  again; nothing was deleted.

## Per-page allowances
- Marketing page shows real photographs only, listed in `lib/photos.ts`
  (the gallery is hidden while that list is empty — no stock photos).
- App pages: no enrichment — function carries the page.

## What pages MUST share
- The wordmark (Devanagari + "Shree Gangaur Study Library").
- Geist throughout, Geist Mono for numerals.
- The accent and its placement rules.
- Button shape, radius, padding rhythm.
- Page header pattern: 28px title, one-line 15px subtitle, actions right.
- Modals are Radix `Dialog` (Escape, focus trap, focus back to the opener),
  never a hand-made overlay.
- `npm run check:ui` passes: no serious axe issues, no sideways scroll, no
  tap target under 24×24 px, no console errors, at 390 and 1280 px.

## What pages MAY differ on
- Working-surface composition (plan / table / form / chart).

## Bans (on top of the Hallmark slop test)
Italic or gradient headings · glow/blur orbs · sheen sweeps · uppercase
letter-spaced eyebrows above headings · centred-everything heroes · saffron
filled toggles · emoji as icons · clip-art sprites on the plan · stock photos.

## Agent skills (installed in `.agents/skills`, linked from `.claude/skills`)
From `npx ui-skills` (ui-skills.com), run on 2026-10-24:
- `baseline-ui` — the code rules this file assumes: `cn()` is tailwind-merge,
  `h-dvh` not `h-screen`, Tailwind's fixed z-scale (bars z-30, backdrops
  z-40, dialogs z-50), `size-*` for squares, no gradients, no unrequested
  animation, AlertDialog/Modal for destructive actions.
- `ui-review` — critique from renders at 390 and 1280 px, findings need a
  measured location.
- `subtractive-design` — every mark on a screen must serve the task; seat
  chips show number + initials + only the state that needs acting on.
- Also installed: `fixing-accessibility`, `fixing-motion-performance`,
  `fixing-metadata`, `improve-ui`.

