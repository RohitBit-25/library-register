# UI/UX pass — Gangaur Library

**Date:** 13–14 August 2026
**Scope:** all 15 pages, both admin and public, at 1440px and 390px
**Method:** the app was run against a seeded database of 71 occupied seats, 60 payments and 45 days of attendance, then every page was screenshotted, measured in the browser, and re-checked after each change. Findings below are things that were observed on screen or measured in the DOM, not read off the source.

---

## 0. How this was done, and why it matters

The previous audits read the code. This one ran it.

That distinction produced most of the findings. A `<h1>` with a font-size class looks correct in a diff; measuring it in the browser showed it rendering at 16px. A seat map component looks fine in review; a 390px viewport showed an empty white box where 95 seats should be. Three of the most serious items in this report — the blank mobile map, the crashing public page, and the silently-dropped type scale — are invisible in source and unmissable on screen.

Two supporting pieces were built to make that possible:

| | |
|---|---|
| `scripts/seed-demo.ts` | Realistic data: 71 of 95 seats taken, expired and overdue members, attendance that dips on Sundays, names from "Om Vyas" to "Chandraprakash Rathore". Refuses to run unless the database name contains `demo` or `scratch`. |
| Browser sweep | Every page at both widths, checking for crashes, horizontal overflow, heading structure, console errors, and text under 10px. |

**Even data hides layout bugs.** A roster of "John Doe" and "Jane Smith" never wraps, never truncates, and never reveals that a name column clips at 14 characters while 300px of the column sits empty.

---

## 1. Broken — things that did not work

### 1.1 The seat map rendered nothing on a phone

The floor plan is a fixed 1160px canvas that scales down to fit. The scaling was `transform: scale(s)` with `transform-origin: top center` on a `w-max` box. On a 390px screen the untransformed 1160px box was centred first and then shrunk, which left the entire plan several hundred pixels to the right of the viewport. The container scrolled, but its scroll position started at 0.

The result: **the primary screen of the app showed an empty white box on the device most admins use.** Every seat in the library, invisible.

The scale also had a floor of `0.45` that could not fit a phone — so even correctly positioned, it would have overflowed.

**Fixed** in `components/seat/SeatMap.tsx`: scale from `top left` into a reserved box of exactly the scaled size, then centre that box. Where the room genuinely cannot fit, the card now says *"Scroll sideways to see the rest of the hall"* rather than letting a third of the library sit silently off-screen.

### 1.2 The public seat-picking page crashed

`/browse` — the page students use to choose a seat — threw on mount and rendered *"Something went wrong"*. It had never worked.

The cause was `@alisaitteke/seatmap-canvas`, a third-party canvas library. The wrapper called `instance.setData(...)`; that method does not exist on `SeatMapCanvas` (the real API is `instance.data.replaceData(...)`). Every visit hit a `TypeError` and the error boundary caught it.

Rather than fix a call into a library that was drawing plain circles on a blank rectangle, it was removed. `/browse` now renders **the same floor plan the admin sees** — the real desks, windows, air conditioning and entrance, in the positions a student will find when they walk in. That is the entire reason to show a map instead of a dropdown.

Removed with it: the library dependency, its stylesheet, `lib/seatmapCanvasAdapter.ts`, and `components/seat/SeatmapCanvasWrapper.tsx`.

### 1.3 The type scale was not being applied

`app/globals.css` defines a type scale (`--text-sm` through `--text-4xl`). Components referenced it as `text-[var(--text-sm)]`.

Tailwind's `text-` prefix covers **both colour and size**, and an arbitrary `var()` is ambiguous, so it compiles to a colour declaration and the font-size is silently dropped. Measured in the browser:

```
text-[var(--text-sm)]  →  16px   (inherited; the token was ignored)
text-sm                →  12.8px (correct)
```

Eleven occurrences across seven files, including `Button.tsx`, `Badge.tsx` and `Toast.tsx` — so **every button label and every status badge in the product was rendering at the inherited 16px** instead of its designed size, and the page titles that used this syntax were 16px while the ones that used named utilities were 39px.

This is most of why the interface felt inconsistent. It was one CSS ambiguity, not eleven design decisions.

**Fixed** by switching to the named utilities, which `@theme` has already remapped onto this project's scale. `PageHeader.tsx` carries a comment so it does not come back.

Related trap, also fixed: `--text-*` stops at `4xl` (3.81rem), so `text-5xl` and `text-6xl` fall through to **stock** Tailwind (3rem, 3.75rem) — both *smaller* than this project's `text-4xl`. The landing hero was therefore 61px on a phone, 48px on a laptop and 60px on a wide screen: it shrank as the screen grew.

### 1.4 Every admin page had two or three `<h1>`s

The sidebar brand and the top bar were both `<h1>`. A screen reader's heading list opened with "Library Register" on every page — the one thing that never changes between them — and the page's actual title was the second or third entry.

**Fixed**: brand marks are now `<p>`. Verified: exactly one `<h1>` per page, on all 15.

---

## 2. Misleading — things that worked but said something untrue

These matter more than the visual items. An interface that is ugly wastes a moment; an interface that is confidently wrong causes a bad decision.

### 2.1 The attendance chart's x-axis was mislabelled

The axis start was the hardcoded string `"Mar 1"`. The chart plots the **last 30 days**. On 13 August it was labelling a window that began 15 July as beginning 1 March — off by four and a half months.

It now takes the real first date from the series. The labels were also `fontSize={10}` *inside* the SVG viewBox, which scales with the container, so they rendered at roughly 28px — larger than the card's own heading. They are HTML now, where 11px means 11px.

### 2.2 Every seat advertised a window

`/browse` printed the same seven amenities for every seat — "Near Window", "Good Lighting", "AC Area", "Quiet Area", "Floor 1 · Quiet Zone · Window Side" — regardless of which seat was selected. Seat 45, in the middle of the room with a wall on no side, claimed a window.

The floor plan already records where the windows and air conditioning are. `seatAmenities()` in `lib/layoutConfig.ts` now derives the claims from the seat's actual position, and only when it sits within one cell of the feature. A claim a student can check by walking in is worth more than a longer list.

### 2.3 A "Floor 2" that does not exist

The seat picker had a floor selector offering "Floor 1 / Floor 2". The library has one floor. Removed, along with a maximise button that did nothing and a legend listing "Blocked" and "You" — two states this app does not have.

### 2.4 Dates that could not be told apart

The members table used a short date with the year always dropped. Seat 9: **joined 22 Aug, 1-year plan, expires 22 Aug.** Two identical strings twelve months apart, in the column an admin uses to decide who to chase.

`fmtDateShort()` now includes the year when it is not the current one. Same-year dates stay short — that is the common case and the reason the year was dropped in the first place. Covered by a self-check.

### 2.5 Names truncated with the space to spare

The dashboard's priority table cut names at 14 characters *in JavaScript*: `"Chandraprakash Rathore"` → `"Chandrapraka…"`, with roughly 300px of empty column beside it. The seat column, meanwhile, was as wide as the name column for a two-digit number.

Now the cell truncates only when it genuinely runs out of room, the full name is available on hover and to a screen reader, and the columns are proportioned to their contents.

### 2.6 Counts that matched no filter

Two places summed *expiring* and *expired* into one number: the map's stat chips and a dashboard card that linked to `?filter=expired`. An expiring membership is a reminder to send; an expired one is a conversation to have. The combined figure told the admin neither, and did not match the list it opened.

Split, on both surfaces.

### 2.7 The quietest day of the week was coloured like an error

The weekly attendance summary printed the low day in the same red as an expired membership. In this library the low day is Sunday. Direction is now carried by the arrow icon; the number is neutral.

---

## 3. Colour — one system doing three jobs

### 3.1 Status and shift shared the same three colour pairs

This was the most consequential visual finding. In `components/ui/Badge.tsx`:

| Colour | Meant | And also meant |
|---|---|---|
| Saffron | **Fee Due** | Full Day |
| Marigold | **Expiring Soon** | Morning |
| Indigo | **Pending** | Evening |

On the members table a payment problem and a time of day were the same chip. Nothing was misaligned; the colours were simply saying two things at once.

**Colour is now reserved for status.** Shift chips are neutral and read through their sun / moon / sun-moon icon. Each colour means exactly one thing.

### 3.2 Member avatars used the status palette

`SeatAvatar` assigned each member a colour by hashing their name — from a palette of the six **status** colours. So a member with an emerald avatar looked active and one with a ruby avatar looked expired, regardless of their real state, directly contradicting the status ring drawn around the same tile.

Ninety-five of them turned the floor plan into confetti and buried the handful of seats that actually needed attention.

The palette is now six warm neutrals varying in weight rather than hue — enough to recognise a regular at a glance, never enough to be mistaken for a status. All clear 4.5:1 with white.

*This is the single biggest visible improvement in the pass. The map went from decorative to readable.*

### 3.3 Selected states and primary actions had drifted off-brand

The floor plan's toggles were brand saffron. The members filter pills, the attendance Today/History toggle, "Mark all present", the requests tabs, the setup step markers and the seat-detail primary button were sapphire or indigo. Same class of control, three different colours depending on which page you were on.

All moved to brand. Indigo is gone entirely — its two jobs (pending, evening) were redundant with sapphire, which remains as the informational colour.

Also removed: a blue→purple gradient badge on the kiosk (the most recognisable "generated" visual tell, and both hues outside the palette), a `from-blue-400 to-indigo-500` strip in the add-member form using stock Tailwind colours outside the token system, and three decorative pastel blobs that bled past their cards' rounded corners.

### 3.4 The dashboard charts

The attendance line and its gradient were sapphire; the membership donut used four unrelated hues borrowed from the status vocabulary. Plan length is an **ordinal** scale — 1M through 1Y — so it now uses one saffron ramp that deepens with the commitment. The line chart is brand saffron: one accent, one data series.

All 23 measured contrast pairs still pass WCAG AA.

---

## 4. Mobile

Beyond the blank map (§1.1):

**Stat chips were scrolled out of sight.** The row was `overflow-x-auto` with `no-scrollbar`, so on a 390px screen only "Total Seats" and "Occupied" were visible, with nothing to suggest more existed. The two counts that need acting on — Fee Due and Expired — were the ones lost. They now wrap.

**A list view for phones.** Even correctly positioned, the plan has to shrink to about 0.42 to fit a phone, which puts a 48px seat at 20px: too small to read a name on, too small to hit. `components/seat/SeatList.tsx` groups seats by the same A–D runs the plan labels, with 56px targets, the member's name, their status and their shift. Phones open on it; the plan is one tap away and remains the default everywhere it fits. This was item #13 on the existing roadmap.

**Verified across all 15 pages at 390px:** no horizontal page scroll anywhere, no crashes, one `<h1>` each.

---

## 5. Public pages

**The landing nav was five dead links.** All five were `href="#"`, and four named sections that were never built — About, Facilities, Rules, Contact. A student clicking any of them stayed exactly where they were. Each also carried an emoji (🏠 🕒 🏢 📋 📞), which a screen reader announces as "house", "clock face three o'clock", and which sat at a different optical weight from every other icon in the product.

The nav now points only at things that exist: Home, Seats, and Facilities (anchored to the amenities section, which is real content). Lucide icons, an active-page indicator, and smooth scrolling with `scroll-padding-top` so anchors do not land under the header.

**About, Rules and Contact were not invented.** Writing a library's rules or contact details would be fabricating information I do not have. Those need your content before they can be linked — noted in §7.

Also on the landing page: "6:00 AM" was breaking onto two lines inside its card, reading as "6:00" over "AM"; a play button promised "Take a quick tour" with no video behind it; and the amenities strip was marked up as `<footer>` while the page had no actual footer. All three fixed.

**The admin sidebar was rendering on the student pages.** An admin visiting `/browse` saw three navigation systems at once — the admin rail, the student rail, and the public header — with the floor plan squeezed into what was left. `/browse` and `/my-requests` bring their own chrome and are now excluded from the admin shell.

---

## 6. Smaller items

| Item | Was | Now |
|---|---|---|
| "Row B" on the floor plan | Hidden beneath the entrance marker — three of four row labels visible | Entrance band shortened; all four verified visible |
| Audit log empty state | `display:flex` on a `<td>`, which removes it from the table box model so `colSpan` is ignored | Proper block layout, with a line explaining what will appear there |
| Browse empty state | A hand-drawn SVG commented `Placeholder for illustration`, reading as a broken-image glyph | Armchair icon on a neutral tile |
| Back control on `/browse` | A bare `<ArrowRight>` rotated 180°, with an `onClick` — not focusable, not announced | A real `<button>` with `ArrowLeft` and an accessible label |
| "+ Add" action | Sapphire on a 10%-alpha fill — the informational colour, and the alpha form this codebase already documents as failing contrast | Brand saffron on a solid tint |
| Kiosk confirm key | Disabled state was faded orange, reading as an enabled button | Disabled state reads as disabled |
| Stat chip labels | 9px at 70% opacity — two contrast reductions stacked | 10px, full opacity |
| Days-remaining on tiles | 8.5px at 80% opacity, the smallest text in the product, on the number that decides who gets chased | 9.5px, full opacity |
| Dashboard title | Decorative ✨ beside it | Removed |
| Page headers | Five different recipes across eleven pages | One `PageHeader` component |

---

## 7. Checked and deliberately not changed

Being explicit about these, since some look like bugs in a screenshot:

- **The sidebar "cutting off" mid-page.** An artifact of full-page screenshots: `position: fixed` elements paint once at viewport height. Measured in a real scrolled viewport — `position: fixed`, `top: 0`, height equals viewport. Correct as written.
- **9px labels inside the floor plan** (Row A, Entrance, Window, seat numbers). These are annotations on a scale drawing; enlarging them crowds the plan. The list view and the seat detail panel carry the readable versions. An accepted density trade-off, not an oversight.
- **`sapphire` as a colour family.** Used in over 100 places as the informational colour, including the Window wall markers, where a sky-blue label is meaningful rather than decorative. Removing it wholesale would have been a rewrite, not a fix. Only its use for *selected states and primary actions* was wrong, and that is what changed.
- **The Unsplash hero image on the landing page.** An external request, and not a photo of this library — but replacing it means having your photograph. Left in place; see below.

---

## 7b. Second pass — the pages I had not looked at closely

The first pass reviewed screenshots of about half the pages in detail. Going back through the rest turned up a further set, including one regression of my own.

### A meter that measured the wrong thing

The Expiry Tracker's urgency bar filled by `100 - (daysLeft / 365)`. Inside a month that puts every bar between 97% and 99%; every expired member was pinned at exactly 100% however far past their date they were. Six overdue members ranging from 9 to 27 days all drew an identical full red bar.

It looked like a precise measurement and carried no information in the only range the page is about. It now measures urgency across the 30-day window either side of the expiry date, so a longer bar genuinely means act sooner — in both directions. The bar also gained `role="img"` with the days as its label, since it was previously invisible to a screen reader.

Ten hardcoded stock hex gradients went with it (`#2563EB`, `#639922`, `#DC2626` and friends), including a blue that means "information" everywhere else in the product.

### A page that showed four times what it claimed

The Expiry Tracker's four summary cards count the next thirty days — 6 expired, 0 today, 8 this week, 19 this month. The table beneath listed **all 71 occupied seats**. Past the first page that meant members with three months left, in a tracker whose heading reads "memberships ending soon".

Now scoped to its own claim — 33 entries, matching the cards — with a *"Show all 71 members"* toggle so nothing is hidden.

### Actions that were invisible on the device they are used on

The Expiry Tracker's row actions sat at `opacity-40` until the row was hovered. On a phone or tablet there is no hover, so **Renew — the entire point of the page — was permanently faded and read as disabled.**

Same pattern in the members table, worse: the copy-to-clipboard buttons beside each seat number and phone number were `opacity-0` until hover, so on touch they did not exist at all, and a keyboard user could tab into a control they could not see.

Fixed with a `.reveal-on-hover` utility that is visible by default and only goes quiet on devices that genuinely have a pointer, with focus always bringing it back. Both copy buttons also gained the accessible labels they were missing.

### `/my-requests` had lost its header — my regression

Excluding the student pages from the admin shell (§5) was right for `/browse`, which brings its own header. `/my-requests` did not: it had been relying on the shell for both its chrome and its page padding. After the change the title printed flush against the top-left corner of the viewport with no header at all.

It now carries the same public header and container as `/browse`, which is what the two student pages should have shared in the first place.

### Sequences coloured as if they were categories

Three more places used unrelated hues for steps on a single scale:

- **Setup** — the four numbered integration steps were blue, green, amber and brown, and the flow diagram above them repeated the same four. The number already carries the order.
- **Export** — three category cards in blue, green and saffron, and a "Quick Summary" printing four unrelated counts in four colours, so "71 active members" wore the information blue and "45 attendance days" wore the green that means a paid-up membership.
- **Expiry** — the four urgency cards ran red, red, amber, **blue**, where blue was the third rung of an escalating ladder.

All three now use one ramp, or neutral where the item carries no state. A full database backup also stopped being outlined in the red this app reserves for expired memberships and destructive actions.

### Smaller items in this pass

| Item | Was | Now |
|---|---|---|
| Two more ✨ icons | Beside the QR panel status and the "Request Seat" heading | Removed |
| `bg-[rgba(34,195,106,0.15)]` | A raw rgba fill where everything else is a token | `--emerald-50` |
| `--amber-500` | Referenced in `setup`, defined nowhere | Gone with the recolour |
| "✓ App Portal Active" | A literal tick character in the string | "Portal active" |
| Titles | "4-Step Integration Guide", "Find Your Requests", "Request Seat #12" | Sentence case |
| `/my-requests` search | Primary action in the information blue | Brand |

### A timezone bug inside the timezone test

`npm run verify` failed during this pass at 00:50 IST. The failing check builds its dates with `new Date().toISOString()` — which is UTC, so between midnight and 05:30 IST it generates *yesterday*, and `daysUntilExpiry(today)` returned `-1` instead of `0`.

The application code was correct; `daysUntil()` uses `todayLocalISO()` precisely to avoid this. The check had reproduced the exact bug it exists to guard against, and would have failed every night in that window. Its helper now builds dates from local parts.

---

## 8. What still needs you

1. **A photograph of the actual library** for the landing hero, replacing the stock image.
2. **Content for About, Rules and Contact** if you want those nav links back — the rules and phone number have to be real.
3. **Whether the kiosk should stay a full-screen page** or become a mode of the seat map. It currently duplicates a floor of navigation.
4. The three credentials-dependent items from `ROADMAP.md` remain open: WhatsApp provider, object storage for ID documents, automated backup.

---

## 9. Verification

```
npm run verify     # lint → tsc → tokens → contrast → 34 self-checks   ✅
npm run build      # compiled, 18/18 static pages                       ✅
npm run check:api  # 29 HTTP contract checks against a live server      ✅
```

Browser sweep, all 15 pages × {1440px, 390px}: no crashes, no horizontal page overflow, exactly one `<h1>` per page, no console errors. Re-run after the second pass with the same result.

**One note on process.** During this pass the dev server reverted to the real database while scripted logins were still sending the demo PIN. That left `failedAttempts: 2` on your admin record — below the 5 that trigger a lockout, so nothing was locked, and no other data was touched. I reset the counter and cleared the rate-limit row. All subsequent work ran against `gangaur_demo`, and the review scripts now reuse one saved session instead of logging in repeatedly.
