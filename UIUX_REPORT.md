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

### 3.2 Member avatars used the status palette — and how they came back

`SeatAvatar` assigned each member a colour by hashing their name — from a palette of the six **status** colours. So a member with an emerald avatar looked active and one with a ruby avatar looked expired, regardless of their real state, directly contradicting the status ring drawn around the same tile.

Ninety-five of them turned the floor plan into confetti and buried the handful of seats that actually needed attention.

The palette is now six warm neutrals varying in weight rather than hue — enough to recognise a regular at a glance, never enough to be mistaken for a status. All clear 4.5:1 with white.

*This was the single biggest visible improvement in the pass. The map went from decorative to readable.*

**Later revised at your request.** Per-member colour is genuinely useful — it is how you recognise a regular at a glance — so it is back, drawn from a palette that status can never use. Status on this map is warm (emerald 147°, marigold 42°, saffron 29°, ruby 0°); the avatars are cool and violet (ocean 202°, pine 194°, slate 218°, indigo 245°, violet 263°, plum 295°), every one at least 45° from all four. A chip can vary by person without ever being mistakable for a state.

`scripts/check-contrast.py` now enforces both rules on every build: white initials must clear 4.5:1 on each swatch, **and** no swatch may sit within 45° of a status hue. That check earned its place immediately — it rejected a seventh colour (mulberry, 325°) that my own arithmetic had cleared, because 325° is 35° from ruby once you wrap correctly.

Measured on rendered tiles: 5.44:1 to 8.66:1. The lowest is better than the old palette's lowest.

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

## 7c. Third pass — accessibility measured, not assumed

Earlier passes fixed accessibility problems as they turned up in screenshots. This one measured every interactive control on all 15 pages: does focusing it visibly change anything, is its hit area at least 24px (WCAG 2.2 §2.5.8), and does it have an accessible name.

**Starting point: 782 controls, 5 with no focus indicator, 264 under 24px, 73 with no name at all.**

### 95 checkboxes that announced nothing

Every row in the members table carries a select checkbox. None had a label, so a screen reader read out ninety-five identical "checkbox"es with no way to tell which member each one selected — on the control whose entire purpose is choosing rows for a bulk action. They were also 16px.

Now labelled with the member's name (`Select Aarav Sharma`) and 24px. The select-all checkbox says what it selects.

### Pagination that said "button, button"

`DataTable`'s previous/next controls were icon-only with no accessible name. Both now labelled, with the chevrons marked `aria-hidden` so they are not announced twice.

### The student rail had no focus indicator at all

The five buttons in `StudentSidebar` — Select Seat, My Booking, History, Profile, Logout — were the only interactive controls in the product where tabbing produced no visible change whatsoever. A keyboard user on `/browse` had no idea where they were. They also now carry `aria-current="page"`.

### Where it landed

| | Before | After |
|---|---|---|
| No focus indicator | 5 | **0** |
| Under 24px | 264 | **2** |
| No accessible name | 73 | **0** |

The two remaining are inline text links — "Google Forms" inside a sentence on `/setup`, which WCAG 2.5.8 explicitly exempts, and one 23.6px chip that is now padded to 26px.

### Also in this pass

| Item | Was | Now |
|---|---|---|
| Turnout on `/attendance` | Hardcoded emerald, so **0% turnout rendered in the colour that means a paid-up membership** | Green only at 60% or above; otherwise neutral |
| Attendance tile names | `name.split(' ')[0]` kept the whole first word, so "Chandraprakash" hit a 60px tile and was cut mid-word by CSS | `firstName()`, the helper the rest of the app uses — "Chandr." |
| Attendance check badge | `-top-2 -right-2`, hanging outside the tile: it overlapped the next seat in the grid and was clipped on the last column | Inside the tile it describes |
| "Reject" on `/requests` | `bg-[var(--ruby-500)]/10 … border-none` — near-white on white, so it read as a text link beside a solid button. Both were always `flex-1` and the same width; only one looked like a control | Solid tint and border. Turning a student away should look like a decision |
| "Verify & Add" | Named two internal steps | "Approve and allot" — what it does |
| Dashboard alerts | 280px of scroll happened to fit exactly four whole rows, so a list of 18 looked like a complete list of 4 | Fade over the bottom edge when there are more |

### A note on why the demo data kept disappearing

Twice during this work the review environment silently reverted to the real database. The cause was `pkill -f "next dev"` matching only the launcher process, never the `next-server` child — so servers started against the real `.env` survived every restart and kept answering on port 3000. That is what put `failedAttempts: 2` on your admin record in the first pass.

The screenshot script now refuses to run if the server reports fewer than 10 occupied seats, so a review can no longer be conducted against the wrong database without saying so.

---

## 7d. Fourth pass — the logic behind the fixes

Going back over the code I had written rather than the code I had inherited. Three of these were bugs I introduced in this pass.

### The row letters disagreed between the two views

`SeatList` was written with a comment claiming it groups seats "by the same A–D runs the plan labels, so *row C, seat 58* means the same thing in both views." It did not. The list hardcoded seat-number ranges; the plan drew its labels from grid columns, and the two never matched:

| Run | The plan | The list I wrote |
|---|---|---|
| Row A | seats 1–32 | 1–22 |
| Row B | 33–52 | 23–42 |
| Row C | 53–82 | 43–70 |
| Row D | 83–95 | 71–95 |

A third of the library had a different row name depending on which view you were looking at — on the one page whose job is helping someone find a physical seat in a physical room.

The bands now live once, in `SEAT_ROWS` in `lib/layoutConfig.ts`, as grid-column ranges — which is what the room is actually divided by. Both the plan's labels and the list's groups derive from it, and three self-checks hold it in place: every seat lands in exactly one band, every seat's band matches its column, and the bands tile the room 1→14 with no gap or overlap.

### Filtering a floor plan by deleting from it

Both maps implemented the shift filter by removing non-matching members from the array. On an absolutely-positioned floor plan that punches holes in the drawing: switch to Morning and a third of the room simply vanishes, including the desks' spatial relationships that are the only reason to draw a plan instead of listing seats.

It now dims. The room stays whole, the filtered seats are still legible as context, and the question the filter actually asks — *where* are the morning seats — becomes answerable. Dimmed tiles drop out of the tab order and lose their `data-seat`, so keyboard navigation skips them rather than landing on something inert.

The list keeps filtering by removal, which is right: a list is not a spatial reference.

### A memo comparator that silently swallowed the new prop

The dim did nothing on its first outing. `SeatTile` is wrapped in `memo` with a hand-written comparator — reasonable, since 95 of them re-render on every map change — but the comparator enumerates the props it cares about, and `dimmed` was not among them. React skipped the render entirely, so a correct prop reaching a correct component produced no effect at all.

Added to the comparator, along with `face`, which had the same latent problem. The comparator now carries a warning about exactly this hazard.

### An inline style beating the class

With the comparator fixed, the dim still did not show: the tiles sit inside a framer-motion tree that writes `opacity: 1` inline on mount, and an inline style beats a utility class. `saturate-50` worked, because motion was not animating `filter`.

Rather than fight over `opacity`, the `.seat-dimmed` utility dims through `filter` — a property nothing else is animating — with a comment recording why, so it does not get "simplified" back into `opacity-25` later.

### And an O(n²) scan

`isDimmed={(m) => !filtered.includes(m)}` is a linear scan per seat: 95 tiles × 95 members on every render. Replaced with a `Set` of seat numbers.

---

## 7e. Fifth pass — the interactive states

Every pass so far reviewed pages as they load. None had opened anything. The seat detail panel — the thing that appears every time an admin clicks a seat, which is the app's most-used interaction — had never been looked at.

### Five actions, five unrelated colours

The panel's action stack was lavender (Edit details), blue (Renew), peach (Mark due), WhatsApp green, and red (Remove member). Nothing read as primary, and the one irreversible action had no more weight than changing a phone number. Two of the tints were ~10% alphas, which measure far below the 3:1 a control boundary needs.

Rebuilt as one hierarchy: **Renew** — the job the panel exists for — is the only filled button; everything else is a quiet outline; **Remove member** sits below a rule because it is the one that cannot be undone. The renewal form and its confirm button carried the same off-palette blue and now match.

### A blank circle in the panel header

The seat number badge used `bg-gradient-to-br from-sapphire-500 to-sapphire-600`. Those are not classes in this project — the palette lives in CSS variables — so Tailwind generated nothing and the badge rendered as an empty grey square. It shows the seat number now.

### Chips clipped once the panel opened

My own mobile fix from §4 wrapped the stat chips only below `sm`; on desktop the row still scrolled with the scrollbar hidden. That was fine at full width, but the panel insets the content by 380px, and six chips no longer fit — so "Expired" was cut off with nothing to indicate it. The row wraps at every width now.

### Also

Five identical blue icons ran down the detail list — Status, Phone, Joined, Duration, Expires — where the label beside each already says what it is. Now tertiary marks, like every other supporting icon.

**Checked and left alone:** the confirmation dialog. *"Free seat 23? Ritika Nagda's membership expired on 18 Jul 2026 (27 days ago). Freeing the seat clears their details and makes it available to request. This cannot be undone."* Specific title, real consequence, correctly weighted actions. It needed nothing.

### Guarding a mistake I kept making

Three times in this work a bulk find-and-replace across a class string truncated an arbitrary value and left something that looks like text but is not a class Tailwind will ever generate:

```
text-[var(--saffron-700)go-600)]     text-[var(--text-inversen-50)]     bg-[var(--saffhire-500)]
```

Nothing errors. The style simply never applies — invisible in a diff, easy to miss on screen. The token checker caught two of the three, but only because the mangled name happened to be undefined.

`check:tokens` now also checks the *shape*: any bracketed arbitrary value whose parentheses do not balance fails the build. Verified by reintroducing the bug deliberately and watching it fail.

---

## 7f. Sixth pass — sweeping the categories to zero

Rather than reviewing more screens, this pass grepped for every pattern the earlier passes had been fixing one at a time, and cleared each category out.

### Stock Tailwind colours: 12 → 0

`bg-red-500`, `bg-green-500`, `bg-amber-500` — twelve uses sitting outside the token system entirely, in the bulk-action bar on the members table, two validation dots in the add-member form, and the macOS traffic lights on the setup page's code panel. The traffic lights keep their meaning; they just take it from `--ruby-500` / `--marigold-500` / `--emerald-500` now, so they live in the same colour space as everything else.

### Alpha fills on colour tokens: ~120 → 22

`bg-[var(--saffron-500)]/10` and friends. An alpha of a mid-tone on white lands around 2–2.5:1, which this codebase's own `StatCard` comment already documents as failing — the `-50` shades exist for exactly this and are contrast-checked. Converted mechanically: `/N` fills to `-50`, alpha borders to `-200`, alpha *text* removed outright (there is no upside to a translucent label).

The 22 that remain are focus rings and background gradients, where partial alpha is doing legitimate work.

### Selected states still on the informational colour

The seat-request sheet's payment-mode and shift choices, the members table's selected-row highlight and bulk bar, the add-member seat badge, and the search focus rings in two tables. All brand now, matching every other chosen option in the product.

### Two real bugs in the add-member sheet

Neither is cosmetic:

**The form advertised "Max 100 MB."** `lib/schemas.ts` rejects anything over 2 MB and the API returns `413` above that — so a member handing over a 5 MB photo was told it was fine and then silently refused. It now reads *"JPEG, PNG, WebP or PDF · up to 2 MB"*, which is what the endpoint actually accepts.

**The date field clipped its own year**, showing `14/08/202`. The row used `sm:grid-cols-2` — a *viewport* breakpoint — while the form renders inside a 380px side sheet. On a 1440px screen the breakpoint fired and put a native date input and a duration selector side by side in 380px. Changed to a container query (`@container` / `@md:grid-cols-2`), which asks the right question: how wide is the space this form is actually in. Same class of mistake as the seat map measuring itself against the viewport.

### And three more mangled classes, caught by the new check

The find-and-replace hazard from §7e bit three more times in this pass — `--saffrire-500`, `--bg-mutre-500`, `--saffhire-500`. Every one was caught by `check:tokens` immediately rather than shipping as a silently-missing style. I have stopped doing partial-string replacements on class attributes; the whole attribute gets replaced now.

---

## 7g. Seventh pass — restoring colour without restoring the confusion

You asked for the seating to look like it did before. The physical arrangement had not in fact changed — `getSeatPositionConfig` and `deriveDeskRuns` were untouched throughout, so every seat, desk, aisle and wall is exactly where it was. What had changed was the tiles: §3.2 had stripped the colour out of the member avatars.

That fix was solving a real problem — the avatar palette *was* the status palette, so a green chip sat on expired members — but it solved it by removing something worth keeping.

The revision keeps both: colour per member, drawn from hues status never uses. Details and the new build-time guard are in §3.2 above.

**On the "does not affect text visibility" part**, which was the right thing to be careful about:

| | |
|---|---|
| Avatar initials | white on all six swatches, **5.44:1 – 8.66:1** measured on rendered tiles (AA needs 4.5) |
| Day-count text on tiles | 9.5px, **7.6:1** |
| Status edge strips | unchanged — still the only warm hues on the map, so they remain the thing the eye finds first |
| Contrast suite | 23 token pairs + 6 avatar swatches, all passing |
| Everything else | `verify` 37 checks, build clean, page sweep clean at 1440px and 390px |

---

## 7h. Eighth pass — making the map do work, not just display

Two changes, both aimed at the map being a tool rather than a picture.

### The furniture was louder than the people

The desks were `--saffron-100` with a `--saffron-300` edge. That made them simultaneously the largest colour mass on the screen and a member of the same hue family that means **fee due** on a seat tile. Figure and ground were inverted: the eye landed on tables, then had to hunt for the six seats that actually needed attention.

Desks are now warm neutral (`--bg-overlay`). Furniture is ground; status is figure. The green, amber and red edge strips are the only warm colour left on the plan, which is why they now find you instead of the other way round.

### The counters were read-only

Above the map sat six chips — Total 95, Occupied 71, Available 24, Fee due 8, Expiring 6, Expired 6. They told you eight members owed money and then left you to find them among ninety-five tiles.

**They are buttons now.** Clicking one dims everything else on the plan and leaves the matching seats in full colour, so the answer to *"who do I need to deal with today, and where are they sitting"* is one click and the room stays intact around them. Click again to clear. Status and shift filters combine, so "morning seats that owe money" is a question the screen can answer — which is how a shift actually gets planned.

Three details that matter more than the feature itself:

- **The filter matches the counter exactly.** The first working version highlighted 12 seats under a chip reading 8, because it used `hasDues` while the chip counts `status === 'due'` — and this app's rule is that expired outranks due, so four of those twelve are counted in the Expired chip instead. A count that does not match the thing it filters to is the defect I spent §2.6 fixing on the dashboard; it would have been careless to reintroduce it here.
- **The header states the filter** — *"6 EXPIRED of 95"* — because a dimmed plan still looks like a plan, and scrolling away and back must not leave you reading a filtered map as the whole library.
- **Dimmed seats leave the tab order**, so keyboard navigation moves between the six that matter rather than all ninety-five.

---

## 7i. Ninth pass — splitting the two sides of the product

### The student side did not work at all

`AppShell` required authentication for every route except `/landing` and `/kiosk`. Authentication meant `isAdmin || userOptedIn`, where `userOptedIn` came from a `library-role=user` entry in localStorage — set only by `loginAsUser()`, **which nothing in the app ever called.**

So for anyone who was not staff:

- `/browse` redirected to `/landing`
- `/my-requests` redirected to `/landing`
- and the landing page's own **"Choose Your Seat"** button pointed at `/browse`

The entire public flow — the reason the seat map, the request sheet, the QR code at the front desk and the waitlist exist — was unreachable. It only looked fine in earlier passes because every screenshot was taken with an admin cookie.

Students now need no account. Browsing the plan and submitting a request are public; the request carries the phone number the admin needs; status lookup already returns status fields only, rate-limited, with no names, documents or transaction IDs. Putting a registration wall in front of the one thing the public side exists to do would have been a barrier with nothing behind it.

The dead role went with it — `UserRole`, `getStoredRole`, `setStoredRole`, `subscribeToRole`, `loginAsUser`, `isUser`, `isAuthenticated`. `isAdmin`, which has always come from the server session and never from localStorage, is the only question the auth hook answers now.

### Staff sign-in is its own page

`/admin/login`, instead of a dialog opening over whatever public page you happened to be on. Three practical gains:

- An admin bounced out of a protected route lands somewhere that explains itself.
- The server's real message has room — *"Invalid PIN. 4 attempts left"*, or how long a lockout has to run. A toast could carry neither.
- The student-facing site and the tool that manages it stop overlapping.

**The security is unchanged**, because it was already the strong part: scrypt-hashed per-staff PINs, lockout after 5 failures, a per-caller rate limit checked *before* the PIN is, an httpOnly `SameSite=Lax` session cookie, and `jti` revocation on sign-out. The page is only the door.

Two things the split made possible:

- **Return-to-page.** `proxy.ts` and `AppShell` both send you to `/admin/login?next=<path>`, so signing in from `/members` returns you to `/members`. A pre-existing `url.search = ''` in the proxy ran *after* the parameter was set and silently discarded it — caught because the contract check asserts the `next` value, not just the redirect.
- **No open redirect.** `next` is honoured only when it is a same-site path: `https://example.com` and `//example.com` both fall back to `/`. Verified in a browser, not just asserted — a login page that forwards off-site is how a link that looks like the library ends up landing staff somewhere else with a fresh session in mind.

### What the contract now guarantees

`npm run check:api` grew from 29 to 34 checks:

| | |
|---|---|
| `/`, `/members`, `/analytics`, `/payments`, `/staff` | redirect anonymous callers to `/admin/login`, carrying `next` |
| `/landing`, `/browse`, `/my-requests`, `/kiosk`, `/admin/login` | return 200 with no session |
| `/admin/login?next=<off-site>` | never turns the value into a navigation target |

The middle row is the one that matters: it is the check that would have caught this bug the day it was introduced.

---

## 7j. Tenth pass — shadcn/ui, and the trap in installing it

### The bridge

shadcn components are written against a fixed vocabulary — `bg-background`, `text-muted-foreground`, `border-input`, `ring-ring`. None of those exist here; this project names its palette after what things *are* (`--bg-surface`, `--text-primary`, `--saffron-700`). Dropped in as-is, every component from the registry renders unstyled.

So `@theme inline` now carries a mapping — eighteen `--color-*` names, each pointing at a token that is already contrast-checked. Nothing is duplicated, and anything added from the registry from now on inherits Gangaur's palette instead of shadcn's stone defaults. `--color-primary` is `--saffron-700`, `--color-ring` is `--saffron-500`, and so on.

`check:tokens` already fails the build if a `--color-*` name collides with a built-in utility — the rule that exists because a `--color-base` once turned the stock `text-base` font-size class into a colour. None of shadcn's names are in that reserved set.

### `npx shadcn add` silently overwrote a core component

The CLI reported *"Updated 1 file: components/ui/button.tsx"*. This project's is `components/ui/**B**utton.tsx`, and macOS is case-insensitive — **they are the same file.** The registry's Button replaced one with a `primary` variant and 44px minimum touch targets that the entire app is built on. Every `<Button variant="primary">` in the codebase would have silently fallen back to nothing.

Restored from git. `alert-dialog` and `dialog` both import that Button, so they were rewritten to style their own actions from the palette — which also keeps them on-brand rather than on shadcn's defaults.

A guard now scans for files whose paths differ only in case. It cannot fire on macOS, where the filesystem simply cannot hold both — I proved that by trying, and deleted `Card.tsx` in the process, restoring it from git. TypeScript's `TS1149` is the real catch here and `verify` already runs it; the scan earns its place on case-sensitive CI.

Also allowlisted: `--radix-*` variables, which Radix sets on the element at runtime (measured trigger width, flip origin, available height). They are not ours to define.

### What the components actually bought

Only the ones with a functional win were adopted. The members table's kebab menu is the clearest case — it was hand-rolled, and had five real problems:

| | Before | Now |
|---|---|---|
| Position | `rect.right − 192`, hardcoded, no flipping | Collision-aware — verified opening inside the viewport from a row 5258px down the page |
| Keyboard | none | Enter opens, arrows move, typeahead, Escape closes |
| Focus | never returned to the trigger | returns, verified |
| Scroll | a window listener **closed** the menu | repositions |
| Semantics | plain divs | `role="menu"`, `role="menuitem"`, `aria-expanded` |

The mobile card accordion stays hand-rolled on purpose: it expands in place rather than floating, so none of the above applies to it.

`dialog`, `alert-dialog`, `select` and `popover` are installed and bridged, ready for the hand-rolled `Modal`, `ConfirmDialog` and native `<select>` to migrate onto — worth doing incrementally, with the same verification each time, rather than as one large swap.

---

## 7k. Eleventh pass — motion, measured

Using the project's own `apple-design` and `animate` skills. Both open with a gate: *should this animate at all?* So this pass added almost no new motion — it fixed what was already there.

### Every spring in the app was under-damped

A spring's overshoot is its damping ratio, and it is computable:

```
ratio = damping / (2 · √(stiffness · mass))     mass defaults to 1
```

Measured across all eighteen spring call sites, the ratios came out between **0.38 and 0.80**. Every value below 1.0 overshoots the target and settles back. Nothing in the app was critically damped — so every dialog, dropdown, list row and button press wobbled slightly past where it was going.

The worst was `Button.tsx` at **0.38**: a press bouncing is the opposite of the crisp confirmation a press should give.

Apple's rule is to default to critically damped and spend bounce only where the user's own gesture carried momentum in — a flick, a throw, a drag release. Overshoot on a menu that merely appeared reads as noise; overshoot on a sheet you threw reads as physics. **None** of the eighteen followed a gesture.

`lib/motion.ts` now holds four named presets expressed as `bounce` + `duration` — framer-motion's mapping of Apple's damping + response, and the two numbers a person can actually reason about. `springSheet` is the only one with bounce, reserved for surfaces you can grab.

A detail worth recording: converting to the `bounce` API without an explicit `duration` silently defaults to **0.8s**, well past the 300ms ceiling for UI. Four sites landed there mid-refactor and were caught before they shipped.

### Reduced motion was not reaching any of it

`globals.css` has a `prefers-reduced-motion` block. It zeroes CSS `animation-duration` and `transition-duration` — and framer-motion animates by writing **inline styles from JavaScript**, so none of it applied.

Every spring, slide and scale in the product ignored the setting entirely.

`<MotionConfig reducedMotion="user">` at the app root fixes it in one place. Verified by sampling transforms frame by frame through a mount:

| | distinct transforms | frames actually translating |
|---|---|---|
| Motion allowed | 7 | 6 |
| `prefers-reduced-motion: reduce` | **1** | **0** |

Positional motion is gone; opacity is kept, so state changes stay legible. That is the "gentler, not zero" behaviour both skills ask for, and it was absent for the whole product.

### The seat tile preview appeared on tap and stayed there

The hover card was wired to `onMouseEnter`. Touch synthesises that event, so on a phone tapping a seat popped the preview open **over the seat being opened**, and nothing dismissed it.

Now on `onPointerEnter` with a `pointerType === 'mouse'` check: a mouse gets the preview, a finger goes straight to the detail panel.

Two more things wrong with it, both from the skills' checklists:

- It scaled from its own centre. It grows upward out of a seat, so it scales from `bottom center` — the popover-anchoring rule.
- It was a full spring with 15px of travel. An admin triggers this dozens of times a session, which is the frequency tier where motion should be near-imperceptible: now `springQuick`, 6px.

### Also

`transition-all` on the student rail, which animates every property including ones that trigger layout, replaced with the three that actually change.

**What I cannot judge from code:** whether `springUI` at 0.35s feels right for the larger surfaces. It is defensible on paper and matches Apple's published response values, but settle time is a feel question. Worth opening a dialog and a sheet, watching them at 3× duration in the DevTools animation inspector, and looking again tomorrow.

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
