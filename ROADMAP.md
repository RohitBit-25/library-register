# Gangaur Library — What to build next

**Written:** 13 Aug 2026, after the floor-plan rebuild.
**Scope:** what would genuinely make this better, ranked by value-to-effort. Not a list of everything possible.

The audit trail of what was *wrong* lives in [AUDIT_REPORT.md](./AUDIT_REPORT.md). This is forward-looking only.

---

## The one-line summary

The app is now correct, secure and honest. What it is not yet is **fast to operate**. Every remaining high-value item is about reducing the number of actions a librarian takes per day, not about adding features.

---

## Tier 1 — the daily grind

These pay for themselves in the first week.

### 1. Attendance — done
The map has an **Attendance mode** — a toggle turns every tile into a check-in
target, so a librarian walks the hall tapping seats instead of working a
separate list of 95 rows. `Mark all present` covers the common full-house day.
The self check-in kiosk is now reachable from the sidebar (it previously had no
entry point anywhere in the app).

- **Tap-to-mark directly on the floor plan.** An "Attendance mode" toggle turns the map into a check-in grid — tap a seat, it goes green. One screen, no navigation. The data model (`$addToSet`) already supports it.
- **A member-facing QR check-in.** Each member gets a QR (the QR panel already exists for the portal); scanning marks them present. This removes the librarian from the loop entirely.

**Why it matters:** attendance is the only task performed ~60× daily. Everything else is performed a handful of times.

### 2. Renewal — done
Was: find member → open panel → Renew → pick date → pick duration → confirm.
Now one click from the Expiry Tracker, defaulting to the member's existing plan
and the correct start date via `renewalStartDate()` — which preserves paid-for
days rather than restarting from today.

- **"Renew again" one-click** on expiring/expired rows, defaulting to their previous plan and the correct start date (`renewalStartDate` already computes this). Two clicks, not six.
- **Bulk renew** from the Expiry Tracker for the common "five people renewed today" case.

### 3. WhatsApp is configured but not connected
`lib/notify.ts` is a working seam running in dry-run. Connecting one provider turns the expiry cron from a log line into actual revenue recovery.

- Wire Meta Cloud API or Gupshup (both cheap in India, both take an hour).
- **Then:** a "Send reminder" button on any expiring row, reusing the same seam.

### 4. Payment receipts — done
`components/payments/Receipt.tsx` renders a printable receipt from any ledger
row, with print CSS isolating `#receipt-print-area`. WhatsApp delivery still
waits on the provider (#3).

- A printable/shareable receipt from any `Payment` row — number, member, plan, amount, date.
- WhatsApp it on collection, once #3 lands.

---

## Tier 2 — trust and scale

### 5. ID documents still live in MongoDB as base64
Flagged in the audit as deferred; it needs a bucket, not a code change. Until then, every admin page load that touches requests ships multi-MB payloads, and government IDs sit unencrypted in the primary collection.

- Move to S3/R2/Vercel Blob with signed URLs.
- Add a retention job: purge documents 30 days after approve/reject.

### 6. ~~There is exactly one admin~~ — DONE
Named staff accounts shipped. Each person has their own PIN, the session carries
their identity, and every audit row records who acted. Owners can add and revoke
staff; revoking preserves the name on rows they already created. The old single
credential migrates automatically, so the existing PIN keeps working.

### 7. No backup runs on its own
Export is manual. A library that loses its member list loses its business.

- A scheduled job writing the full backup to object storage nightly.
- The cron pattern from the reminder job already covers auth and idempotency.

---

## Tier 3 — the product gets smarter

### 8. Waitlist — done
When all 95 seats were full, a student requesting a seat got a flat rejection. That is a lost customer whose phone number you already have.

- `POST /api/requests` now distinguishes the two cases. Seat taken but others free → `409`, so they pick another. Whole library full → the request is stored as `waitlisted` and the response says so, rather than implying a seat is held.
- Vacating a seat returns the queue with the response, and the map toasts *"N on the waitlist — X is first"*. That is the only moment the queue is actionable; a table nobody opens is not a waitlist.
- The Requests page has a Waitlist tab with its own count.
- Automatic notification still waits on the WhatsApp provider (Tier 1 #3).

### 9. Occupancy history — done
`/api/stats` reported *current* occupancy. Nothing recorded what it was last month, so "are we growing?" — the question that decides whether to expand — had no answer.

- `GET /api/cron/snapshot` writes one row per day: occupied, vacant, expired, dues, contract value, collections, attendance. `CRON_SECRET`-guarded, `?date=` backfills a missed day, and the write is an upsert keyed on date so a retry cannot double-count.
- `/api/stats` returns the last 90 days plus a month-over-month `growth` figure.
- Gaps stay gaps. A day the job did not run is absent from the series, never interpolated — the same rule as the attendance chart.
- Counts are stored, not recomputed on read: a deleted member or a changed plan price would otherwise silently rewrite the past.

### 10. Shift sharing — revisit only if the business wants it
You confirmed one seat = one member. If that ever changes, the model needs `(seat, shift)` as the key, and it touches the schema, the map, the stats and the request flow. Worth doing deliberately, not incrementally.

---

## UI/UX — what is still worth doing

| # | Item | Why |
|---|---|---|
| 11 | ~~Seat tiles are busy at 48px~~ — **done.** The tile stacked a seat number, avatar, name, shift icon and day count into a 38px interactive pad — about 70px of content — so `overflow-hidden` clipped the avatar to a semicircle and cut the name entirely. (The name also had `flex-shrink` collapsing it to 2px tall, so it was invisible at *any* font size.) The pad is now 54px inside a 58px wrapper, taking gutter the 76px cell already had, and the name is dropped in favour of the avatar's initials — the hover card carries name, phone, due date and shift. | Legibility at a glance is the map's whole job |
| 23 | ~~Text was unreadable site-wide~~ — **done.** 89% of all text rendered under 14px: the type scale's 1.25 ratio collapses downward to 10.24/12.8px, and 155 hardcoded sizes (including `text-[0.64rem]`, the old scale value in raw rem) bypassed the tokens. Floors are now 12px and 14px, the logo mark went 36→44/56px, and `check:tokens` fails on any hardcoded size below 12px. | You could not read your own app |
| 24 | ~~Icons and stat hierarchy~~ — **done.** 416 icons rendered under 16px beside 14px text; 97 moved to 16px (status dots deliberately left small). The dashboard stat chips had a 12px wide-tracked uppercase label beating the 14px number it described — the value is now 20px. | Legibility is not only font size |
| 25 | ~~Floor plan sizing~~ — **done.** Desks were a 3.3× stretch of a 2073×758 sprite (hence the pillar look); `border-image-repeat: round` now holds an end cap at each end and tiles only the middle. The plan also only ever fitted to *width*, so at 1184px tall the room never fit on screen. `/floorplan` is now a purpose-built page — full viewport, fits both axes, zoom fit/100%/±, phones open at 100% and pan — instead of the whole dashboard in a wrapper. | A floor plan you cannot see whole is not a floor plan |
| 26 | ~~Student map was the smallest in the app~~ — **done.** `/browse` rendered seats at 33px while giving 320px to a "My Booking" empty state whose "Choose Seat" button called `setSelectedSeat(null)` — already null, a no-op. The panel now appears only when it has something to show, and the map defaults to fit-width (49px seats) with whole-room one click away. | The public flow had the worst map |
| 27 | ~~Landing page: external request, inverted emphasis, wasted motion~~ — **done.** Dropped a `transparenttextures.com` fetch (the page now loads zero external hosts), moved emphasis from the never-changing opening hours to the live free-seat count and surfaced that count in the hero, and replaced load-time animation delays with an intersection-triggered reveal — the amenities grid used to finish animating half a second after load, a full screen below the fold. | First impression, and the only page the public lands on |
| 28 | ~~No pricing on the public site~~ — **done.** `lib/pricing.ts` held the rates and formatters all along and the landing page showed none of them. A Plans section now derives every figure from that module (nothing hardcoded, so `NEXT_PUBLIC_PLAN_RATES` still works) and the best-value badge is computed from lowest monthly cost — verified by an override where 6 months beat 1 year and the badge moved on its own. | Cost is the second question every student asks |
| 29 | ~~Seat numbering had no rule~~ — **done.** Redrawn to your sketch: the lower number of a pair sits left, its successor across the desk on the same row, so the room reads 11, 12, 13, 14 left-to-right. Replaces a scheme that ran 1–10 down one column, 11–20 two columns over, and dropped 21–22 against another wall. The sketch's gaps (4, 87, 90) were filled and its 94 max extended to 95 via the top-wall run, so nothing in the model, schema or database changed. | Finding seat 43 meant hunting |
| 12 | ~~No empty state on the floor plan~~ — **done.** A library with nothing allotted now gets a first-run panel naming the state and pointing at adding the first member, instead of 95 unexplained dashed squares. | First-run impression |
| 13 | ~~Mobile floor plan~~ — **done.** `components/seat/SeatList.tsx` gives phones a grouped list with 56px targets; the plan is one tap away. Both views derive their A–D row bands from `SEAT_ROWS`, so a seat has the same row name in each. | Most Indian admins will use a phone |
| 14 | ~~Keyboard navigation on the map~~ — **done.** Arrow keys move across the floor plan; Enter opens the seat. Tab order follows seat number, which jumps across the room between runs, so reaching seat 90 took 90 presses. Movement is capped at two cells of sideways drift, so Up at seat 1 does nothing rather than teleporting nine columns to seat 80, and an edge press leaves the key unhandled so the page still scrolls. | Speed for a daily operator |
| 15 | ~~`icon-512.png` is 319 KB~~ — **done.** 31.5 KB at the same 512×512; the art is flat colour so quantisation is visually lossless. | Carried over from the original audit |
| 21 | ~~Seat targets were 16×16 on a phone~~ — **done.** `/browse` scales the whole plan to fit 390px, leaving every seat two thirds under the 24px WCAG 2.5.8 floor — on the one flow the public actually uses. Phones now get an **Available seats** list of 44×44 targets under the map, which is 2.5.8's "equivalent control" exemption; the accessibility script knows about it, so deleting the list fails the check rather than passing quietly. | Booking a seat is the public flow |
| 22 | ~~Unlabelled fields and unnamed buttons~~ — **done.** Three search inputs carried a placeholder and no label (a placeholder vanishes the moment you type), the `/my-requests` phone field's `<label>` sat in a sibling `div` and was associated with nothing, and two buttons there hide their text below `sm` — leaving a bare icon on the screens most students use. Five pages also jumped `h1` → `h3`, so heading navigation landed nowhere. | Eleven passes had missed all of it |

---

## Backend — what is still worth doing

| # | Item | Why |
|---|---|---|
| 16 | ~~No rate limit on `POST /api/requests`~~ — **done**, and `POST /api/auth` now has one too. The per-staff lockout cannot tell which account a wrong PIN was meant for, so a failure counted against every account — anyone could lock the whole staff out for 15 minutes, repeatedly, without credentials. A 12-per-15-minutes per-caller limit runs before the PIN is checked. It does not stop a distributed attempt; that is a real residual risk of PIN-only auth. | The last unprotected public write |
| 17 | **`/api/members` returns all 95 rows** — *recommended out of scope.* The room has a fixed 95 seats, and the anonymous response is already redacted to `seat`/`vacant`/`shift`. Paging machinery for a number that cannot grow is complexity without benefit; revisit only if a second branch appears. | Pagination before a second branch |
| 18 | ~~No structured logging~~ — **done.** `lib/log.ts` replaces 25 bare `console.error` calls with JSON lines carrying `route`, `reqId` and `message` as fields. `apiError()` logs and responds in one call, so a 500 whose id was never logged is not expressible, and the id reaches the user three ways: the log line, the `x-request-id` header, and the response body — member add/update/vacate toasts end with `(ref a3f9c1d2)`. No logging dependency: the need is grepping one id on one small server. Note the id is per *failure*, not per request — React's `cache()` is render-scoped and silently returns a fresh value in a Route Handler, which was measured with a probe, not assumed. | Debugging production blind |
| 19 | ~~Audit log has no UI filter~~ — **done.** One search across action, details, staff name and seat number, with a live result count for screen readers and two distinct empty states — "no activity recorded yet" and "nothing matches …" are different situations and the second one offers a way back. | It exists but is hard to use |
| 20 | ~~Tests cover pure functions only~~ — **done.** `npm run check:api` runs 34 HTTP contract checks against a live server: auth boundaries on every admin route, PII redaction on the public `/api/members`, page redirects, payload validation, rate limiting, the waitlist branches, and session revocation. Each POST claims its own `x-forwarded-for` so the suite cannot poison its own rate-limit window. The lockout check is opt-in (`CHECK_LOCKOUT=1`) because it locks staff out for 15 minutes. | Those are the parts that carry risk |

---

## What I would do first

If you only do three things: **tap-to-mark attendance (#1)**, **one-click renew (#2)**, and **connect WhatsApp (#3)**.

They share a theme — the app currently records what happened, and those three make it *save time while it happens*. Everything in Tier 2 is insurance; everything in Tier 3 is growth. Tier 1 is the difference between software the librarian tolerates and software they rely on.
