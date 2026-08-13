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

### 1. Attendance is the biggest unsolved workflow
The kiosk exists, but marking 60 people present is still 60 interactions. The seat map already knows who sits where.

- **Tap-to-mark directly on the floor plan.** An "Attendance mode" toggle turns the map into a check-in grid — tap a seat, it goes green. One screen, no navigation. The data model (`$addToSet`) already supports it.
- **A member-facing QR check-in.** Each member gets a QR (the QR panel already exists for the portal); scanning marks them present. This removes the librarian from the loop entirely.

**Why it matters:** attendance is the only task performed ~60× daily. Everything else is performed a handful of times.

### 2. Renewal is a 6-step flow that should be 1
Today: find member → open panel → Renew → pick date → pick duration → confirm.

- **"Renew again" one-click** on expiring/expired rows, defaulting to their previous plan and the correct start date (`renewalStartDate` already computes this). Two clicks, not six.
- **Bulk renew** from the Expiry Tracker for the common "five people renewed today" case.

### 3. WhatsApp is configured but not connected
`lib/notify.ts` is a working seam running in dry-run. Connecting one provider turns the expiry cron from a log line into actual revenue recovery.

- Wire Meta Cloud API or Gupshup (both cheap in India, both take an hour).
- **Then:** a "Send reminder" button on any expiring row, reusing the same seam.

### 4. Payment receipts
The ledger records every payment but nothing gives the member proof.

- A printable/shareable receipt from any `Payment` row — number, member, plan, amount, date.
- WhatsApp it on collection, once #3 lands.

---

## Tier 2 — trust and scale

### 5. ID documents still live in MongoDB as base64
Flagged in the audit as deferred; it needs a bucket, not a code change. Until then, every admin page load that touches requests ships multi-MB payloads, and government IDs sit unencrypted in the primary collection.

- Move to S3/R2/Vercel Blob with signed URLs.
- Add a retention job: purge documents 30 days after approve/reject.

### 6. There is exactly one admin
One PIN, shared. The audit log says "Admin" for every action, so it cannot answer *who* vacated a seat.

- Named staff accounts, each with their own PIN.
- Stamp `user` on `AuditLog` — the field already exists and always says "Admin".
- Optional: a read-only role for a helper who marks attendance but cannot vacate seats.

### 7. No backup runs on its own
Export is manual. A library that loses its member list loses its business.

- A scheduled job writing the full backup to object storage nightly.
- The cron pattern from the reminder job already covers auth and idempotency.

---

## Tier 3 — the product gets smarter

### 8. Waitlist
When all 95 seats are full, a student requesting a seat gets a rejection. That is a lost customer with a known phone number.

- Queue requests against a full house; notify automatically when a seat frees (the vacate path already exists).

### 9. Occupancy history
`/api/stats` reports *current* occupancy. Nothing records what it was last month, so "are we growing?" is unanswerable.

- A nightly snapshot row: date, occupied, vacant, revenue.
- Then the dashboard can show a real trend — the same honesty rule as the attendance chart: no invented data points.

### 10. Shift sharing — revisit only if the business wants it
You confirmed one seat = one member. If that ever changes, the model needs `(seat, shift)` as the key, and it touches the schema, the map, the stats and the request flow. Worth doing deliberately, not incrementally.

---

## UI/UX — what is still worth doing

| # | Item | Why |
|---|---|---|
| 11 | **Seat tiles are busy at 48px** — avatar, name, shift icon, day count and a progress ring compete inside one small square. The ring duplicates what the tile colour already says. | Legibility at a glance is the map's whole job |
| 12 | **No empty state on the floor plan** for a brand-new library — 95 dashed squares with no explanation | First-run impression |
| 13 | **Mobile floor plan** is a pinch-and-pan experience; fit-to-width helps but a list view would serve phones better | Most Indian admins will use a phone |
| 14 | **Keyboard navigation on the map** — arrow keys between seats, Enter to open. Currently mouse-only. | Speed for a daily operator |
| 15 | **`icon-512.png` is 319 KB** for a 512px icon; should be ~20 KB | Carried over from the original audit |

---

## Backend — what is still worth doing

| # | Item | Why |
|---|---|---|
| 16 | **No rate limit on `POST /api/requests`** — the public submission endpoint. Size is capped; frequency is not. One script can fill the admin queue. | The last unprotected public write |
| 17 | **`/api/members` returns all 95 rows** on every page. Fine at 95, wrong at 500. | Pagination before a second branch |
| 18 | **No structured logging.** `console.error` only — no request IDs, so a user report cannot be traced to a failure. | Debugging production blind |
| 19 | **Audit log has no UI filter** — 100 rows, no search by seat or action | It exists but is hard to use |
| 20 | **Tests cover pure functions only.** The API routes — where the races and the auth live — are verified by hand each time. | Those are the parts that carry risk |

---

## What I would do first

If you only do three things: **tap-to-mark attendance (#1)**, **one-click renew (#2)**, and **connect WhatsApp (#3)**.

They share a theme — the app currently records what happened, and those three make it *save time while it happens*. Everything in Tier 2 is insurance; everything in Tier 3 is growth. Tier 1 is the difference between software the librarian tolerates and software they rely on.
