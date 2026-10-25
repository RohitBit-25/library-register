#!/usr/bin/env node
/**
 * Assert-based self-check for the pure logic that carries money and dates.
 * No test framework — run with: npm test
 *
 * Covers the two things most likely to break silently:
 *   - CSV escaping / formula injection (values come from a public form)
 *   - expiry + status derivation (drives fee collection and the seat map)
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Transpile the TS sources we need into a temp dir, then import them.
// Inside the project, not the OS temp dir, so the compiled files can resolve
// npm packages (lib/utils imports tailwind-merge) from node_modules.
const cacheDir = join(root, 'node_modules', '.cache');
mkdirSync(cacheDir, { recursive: true });
const out = mkdtempSync(join(cacheDir, 'lib-selfcheck-'));
writeFileSync(join(out, 'package.json'), '{"type":"module"}');
// allowImportingTsExtensions + rewriteRelativeImportExtensions: the lib/ files
// import each other with explicit .ts extensions (so plain Node can load them
// in scripts/), and tsc rewrites those to .js on emit.
execFileSync('npx', [
  'tsc', 'lib/csv.ts', 'lib/utils.ts', 'lib/types.ts', 'lib/seat-status.ts',
  'lib/notify.ts', 'lib/log.ts', 'lib/pricing.ts', 'lib/layoutConfig.ts', 'lib/deskLayout.ts', 'lib/motion.ts', 'lib/schemas.ts',
  '--outDir', out, '--module', 'esnext', '--target', 'es2020',
  '--moduleResolution', 'bundler', '--skipLibCheck',
  '--allowImportingTsExtensions', '--rewriteRelativeImportExtensions',
], { cwd: root, stdio: 'inherit' });

const { escapeCsvValue, toCsv } = await import(pathToFileURL(join(out, 'csv.js')).href);
const { calcExpiry, daysUntilExpiry, firstName, renewalStartDate, fmtDateShort } =
  await import(pathToFileURL(join(out, 'utils.js')).href);
const { getSeatState, getSeatStatus, todayLocalISO, addDaysISO } =
  await import(pathToFileURL(join(out, 'seat-status.js')).href);
const { buildExpiryMessage, normalisePhone } =
  await import(pathToFileURL(join(out, 'notify.js')).href);
const { planPrice, monthlyValue, formatINR, formatINRCompact, PLAN_MONTHS, DEFAULT_PLAN_RATES } =
  await import(pathToFileURL(join(out, 'pricing.js')).href);

const { nextSeatInDirection, getSeatPositionConfig, SEAT_GROUPS, SEAT_NUMBERS, isSeat, seatRow, partnerSeat, chairRect } =
  await import(pathToFileURL(join(out, 'layoutConfig.js')).href);

const { allSeatSlots, DESK_W, DESK_H, ROOM } =
  await import(pathToFileURL(join(out, 'deskLayout.js')).href);
const { seatNumber } = await import(pathToFileURL(join(out, 'schemas.js')).href);

const { projectMomentum, shouldDismissSheet } =
  await import(pathToFileURL(join(out, 'motion.js')).href);

const { newRequestId, logError, logInfo, apiError } =
  await import(pathToFileURL(join(out, 'log.js')).href);

let n = 0;
const check = (name, fn) => { fn(); n++; console.log(`  ok  ${name}`); };

console.log('\nCSV');

check('plain values pass through unquoted', () => {
  assert.equal(escapeCsvValue('Rohit'), 'Rohit');
  assert.equal(escapeCsvValue(42), '42');
});

check('embedded quotes are doubled and wrapped', () => {
  // The old code wrapped in bare quotes with no doubling, which split the row.
  assert.equal(escapeCsvValue('Rohit "Bob" Singh'), '"Rohit ""Bob"" Singh"');
});

check('commas and newlines force quoting', () => {
  assert.equal(escapeCsvValue('Singh, Rohit'), '"Singh, Rohit"');
  assert.equal(escapeCsvValue('line1\nline2'), '"line1\nline2"');
});

check('formula prefixes are neutralised', () => {
  // A name submitted through the public form must not execute in Excel.
  assert.equal(escapeCsvValue('=cmd|\'/c calc\'!A1'), '"\'=cmd|\'/c calc\'!A1"');
  for (const p of ['=', '+', '-', '@']) {
    assert.ok(escapeCsvValue(`${p}HYPERLINK("x")`).includes(`'${p}`),
      `prefix ${p} not neutralised`);
  }
});

check('null and undefined become empty', () => {
  assert.equal(escapeCsvValue(null), '');
  assert.equal(escapeCsvValue(undefined), '');
});

check('a malicious name cannot break out of its row', () => {
  const csv = toCsv(['Seat', 'Name'], [[1, 'Evil","injected'], [2, 'Normal']]);
  assert.equal(csv.split('\r\n').length, 3, 'row count changed — escaping failed');
});

console.log('\nDates & status');

check('calcExpiry adds the right span', () => {
  assert.equal(calcExpiry('2026-01-15', '1M'), '2026-02-15');
  assert.equal(calcExpiry('2026-01-15', '3M'), '2026-04-15');
  assert.equal(calcExpiry('2026-01-15', '6M'), '2026-07-15');
  assert.equal(calcExpiry('2026-01-15', '1Y'), '2027-01-15');
});

check('calcExpiry clamps to the end of a short month', () => {
  // setMonth overflow used to give 2026-03-03 here: three free days.
  assert.equal(calcExpiry('2026-01-31', '1M'), '2026-02-28');
  assert.equal(calcExpiry('2028-01-31', '1M'), '2028-02-29');
  assert.equal(calcExpiry('2026-03-31', '1M'), '2026-04-30');
  assert.equal(calcExpiry('2026-08-31', '6M'), '2027-02-28');
  assert.equal(calcExpiry('2028-02-29', '1Y'), '2029-02-28');
  assert.equal(calcExpiry('2026-11-30', '3M'), '2027-02-28');
});

check('calcExpiry returns empty for missing input', () => {
  assert.equal(calcExpiry('', '3M'), '');
  assert.equal(calcExpiry('2026-01-15', ''), '');
});

check('daysUntilExpiry sign is correct either side of today', () => {
  // Local date parts, not toISOString(). This helper used to build its dates
  // in UTC, so between midnight and 05:30 IST it generated *yesterday* and
  // the check failed with -1 !== 0 — the very timezone bug todayLocalISO()
  // exists to prevent, reproduced inside its own test.
  const iso = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  assert.equal(daysUntilExpiry(iso(0)), 0);
  assert.ok(daysUntilExpiry(iso(10)) > 0);
  assert.ok(daysUntilExpiry(iso(-10)) < 0);
});

const TODAY = '2026-08-13';
const at = (offset) => addDaysISO(TODAY, offset);
const member = (over) => ({
  seat: 1, name: 'A', phone: '', joinDate: '', duration: '3M',
  shift: 'full', vacant: false, fee: 'paid', ...over,
});

check('status precedence: vacant > expired > due > expiring > active', () => {
  const s = (o) => getSeatStatus(member(o), TODAY);
  assert.equal(s({ vacant: true, fee: 'due', expiry: at(-5) }), 'vacant');
  assert.equal(s({ fee: 'due', expiry: at(90) }), 'due');
  assert.equal(s({ expiry: at(-5) }), 'expired');
  assert.equal(s({ expiry: at(3) }), 'expiring');
  assert.equal(s({ expiry: at(90) }), 'active');
});

check('expired outranks due — an overstayer is not merely "Fee Due"', () => {
  // The whole point of the precedence change. Someone 5 months past their term
  // who never paid used to read as "due", hiding that the seat should be
  // reclaimed and counting them in the wrong dashboard tile.
  const overstayer = member({ fee: 'due', expiry: at(-150) });
  assert.equal(getSeatStatus(overstayer, TODAY), 'expired');
});

check('hasDues survives the precedence change', () => {
  // Losing the money signal would be an unacceptable trade for the above.
  const overstayer = getSeatState(member({ fee: 'due', expiry: at(-150) }), TODAY);
  assert.equal(overstayer.status, 'expired');
  assert.equal(overstayer.hasDues, true);

  const paidUp = getSeatState(member({ fee: 'paid', expiry: at(-150) }), TODAY);
  assert.equal(paidUp.status, 'expired');
  assert.equal(paidUp.hasDues, false);
});

check('expiring window boundary is 7 days inclusive', () => {
  assert.equal(getSeatStatus(member({ expiry: at(7) }), TODAY), 'expiring');
  assert.equal(getSeatStatus(member({ expiry: at(8) }), TODAY), 'active');
  assert.equal(getSeatStatus(member({ expiry: at(0) }), TODAY), 'expiring');
});

check('a member with no expiry is never expired', () => {
  const s = getSeatState(member({ expiry: '' }), TODAY);
  assert.equal(s.status, 'active');
  assert.equal(s.daysLeft, Infinity);
});

check('dates are local, not UTC — no overnight off-by-one', () => {
  // todayISO() was `new Date().toISOString()`, which is UTC. In IST (+5:30)
  // that returns YESTERDAY between 00:00 and 05:30 every day, so members got
  // join dates a day early and the cron targeted the wrong cohort.
  const midnightIST = new Date(2026, 7, 14, 0, 30); // 14 Aug, 00:30 local
  assert.equal(todayLocalISO(midnightIST), '2026-08-14');
  // The UTC form only lands on the previous day east of UTC (IST, the
  // library's zone); asserting it unconditionally failed on any machine west.
  if (midnightIST.getTimezoneOffset() < 0) {
    assert.notEqual(midnightIST.toISOString().split('T')[0], '2026-08-14');
  }
});

check('addDaysISO crosses month and year boundaries', () => {
  assert.equal(addDaysISO('2026-08-30', 3), '2026-09-02');
  assert.equal(addDaysISO('2026-12-30', 3), '2027-01-02');
  assert.equal(addDaysISO('2028-02-28', 1), '2028-02-29'); // leap year
});

check('reminder window catches a cohort a missed run would have skipped', () => {
  // The cron used to match `expiry === today + 3` exactly, so one failed run
  // meant that day's members were never reminded. A window self-heals.
  const windowEnd = addDaysISO(TODAY, 3);
  for (const offset of [0, 1, 2, 3]) {
    const e = at(offset);
    assert.ok(e >= TODAY && e <= windowEnd, `expiry ${e} should be in window`);
  }
  assert.ok(at(4) > windowEnd, 'day 4 is outside the window');
  assert.ok(at(-1) < TODAY, 'already-expired is outside the window');
});

check('reminder message and phone normalisation', () => {
  assert.match(buildExpiryMessage({ name: 'Rohit Singh', phone: '9829230576', seat: 7, expiry: at(1), today: TODAY }), /tomorrow/);
  assert.match(buildExpiryMessage({ name: 'Rohit', phone: '9829230576', seat: 7, expiry: TODAY, today: TODAY }), /today/);
  assert.match(buildExpiryMessage({ name: 'Rohit', phone: '9829230576', seat: 7, expiry: at(3), today: TODAY }), /in 3 days/);
  assert.equal(normalisePhone('98292 30576'), '919829230576');
  assert.equal(normalisePhone('919829230576'), '919829230576');
  assert.equal(normalisePhone('123'), null);
});

check('renewing early keeps the days already paid for', () => {
  // Term runs to the 20th, member renews on the 15th. Renewal must start from
  // the 20th, not today — otherwise they lose 5 days they paid for.
  assert.equal(renewalStartDate('2026-08-20', '2026-08-15'), '2026-08-20');
  assert.equal(calcExpiry(renewalStartDate('2026-08-20', '2026-08-15'), '3M'), '2026-11-20');
});

check('renewing late does not grant free backdated time', () => {
  // Term ended on the 5th, member renews on the 15th: start from today.
  assert.equal(renewalStartDate('2026-08-05', '2026-08-15'), '2026-08-15');
});

check('renewalStartDate handles a member with no expiry', () => {
  assert.equal(renewalStartDate('', '2026-08-15'), '2026-08-15');
});

console.log('\nPricing');

check('every plan has a price and a month count', () => {
  for (const plan of ['1M', '3M', '6M', '1Y']) {
    assert.ok(planPrice(plan) > 0, `${plan} has no price`);
    assert.ok(PLAN_MONTHS[plan] > 0, `${plan} has no month count`);
  }
});

check('unknown or empty duration is worth 0, never NaN', () => {
  // A member mid-signup has duration '' — that must not poison a total.
  for (const bad of ['', undefined, null, 'banana', '2M']) {
    assert.equal(planPrice(bad), 0, `planPrice(${bad}) should be 0`);
    assert.equal(monthlyValue(bad), 0, `monthlyValue(${bad}) should be 0`);
  }
});

check('longer plans are cheaper per month', () => {
  // If this inverts, the rate table has a typo that would quietly cost money.
  const perMonth = ['1M', '3M', '6M', '1Y'].map(monthlyValue);
  for (let i = 1; i < perMonth.length; i++) {
    assert.ok(
      perMonth[i] <= perMonth[i - 1],
      `plan ${i} costs more per month than the shorter one`
    );
  }
});

check('monthlyValue is price divided by months', () => {
  assert.equal(monthlyValue('1Y'), DEFAULT_PLAN_RATES['1Y'] / 12);
  assert.equal(monthlyValue('3M'), DEFAULT_PLAN_RATES['3M'] / 3);
});

check('outstanding total sums only unpaid plans', () => {
  const members = [
    { duration: '3M', fee: 'due' },
    { duration: '1Y', fee: 'paid' },
    { duration: '1M', fee: 'due' },
    { duration: '',   fee: 'due' },   // mid-signup, no plan yet
  ];
  const outstanding = members
    .filter(m => m.fee === 'due')
    .reduce((sum, m) => sum + planPrice(m.duration), 0);
  assert.equal(outstanding, DEFAULT_PLAN_RATES['3M'] + DEFAULT_PLAN_RATES['1M']);
});

check('currency formatting is whole rupees', () => {
  assert.match(formatINR(1900), /1,900/);
  assert.ok(!formatINR(1900).includes('.'), 'should not show paise');
  assert.equal(formatINRCompact(800), '₹800');
  assert.equal(formatINRCompact(45600), '₹45.6K');
  assert.equal(formatINRCompact(120000), '₹1.2L');
});

check('firstName truncates long names', () => {
  assert.equal(firstName('Rohit Singh'), 'Rohit');
  assert.equal(firstName('Chandrashekhar Rao'), 'Chandr.');
  assert.equal(firstName(''), '');
});

// ─── Sheet gesture: where a flick is going ───────────────────────

check('a flick projects further than a slow drag', () => {
  // Apple's deceleration curve: the faster you let go, the further it coasts.
  assert.ok(projectMomentum(2000) > projectMomentum(500));
  assert.ok(projectMomentum(500) > projectMomentum(0));
  assert.equal(projectMomentum(0), 0);
});

check('projection is signed — an upward flick projects upward', () => {
  assert.ok(projectMomentum(-1200) < 0);
});

check('a slow drag past halfway dismisses, a slow drag short of it does not', () => {
  const H = 600;
  assert.equal(shouldDismissSheet(400, 0, H), true);
  assert.equal(shouldDismissSheet(100, 0, H), false);
});

check('a fast flick dismisses from well short of halfway', () => {
  // The whole point of projecting: released at a sixth of the way down but
  // moving fast, the throw was heading past the threshold.
  const H = 600;
  assert.equal(shouldDismissSheet(100, 0, H), false, 'same offset, no velocity, stays');
  assert.equal(shouldDismissSheet(100, 900, H), true, 'same offset, thrown, dismisses');
});

check('an upward flick keeps the sheet even from far down', () => {
  // Reverse on the velocity sign, not the position — a user who dragged low
  // and flicked back up is asking to keep it.
  assert.equal(shouldDismissSheet(500, -800, 600), false);
});

// ─── Blocks: the plan and the list must agree ────────────────────

check('the hall has 93 seats: 1–95 without 21 and 22', () => {
  assert.equal(SEAT_NUMBERS.length, 93);
  assert.equal(isSeat(21), false);
  assert.equal(isSeat(22), false);
  assert.equal(isSeat(94), true);
  for (let n = 1; n <= 95; n++) if (n !== 21 && n !== 22) assert.ok(isSeat(n), `seat ${n} missing`);
});

check('validation rejects numbers that are not seats', () => {
  assert.equal(seatNumber.safeParse(20).success, true);
  assert.equal(seatNumber.safeParse(21).success, false);
  assert.equal(seatNumber.safeParse(22).success, false);
  assert.equal(seatNumber.safeParse(96).success, false);
});

check('every seat is in exactly one group, in the owner\'s order', () => {
  const all = SEAT_GROUPS.flatMap((g) => g.seats);
  assert.equal(all.length, 93);
  assert.equal(new Set(all).size, 93);
  for (const n of SEAT_NUMBERS) assert.ok(seatRow(n), `seat ${n} has no group`);
  const g = Object.fromEntries(SEAT_GROUPS.map((x) => [x.id, x.seats]));
  assert.deepEqual(g.leftWall, [95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85]);
  assert.deepEqual(g.rightWall, [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  assert.deepEqual(g.bottomRow, [84, 83, 82, 81, 80]);
  assert.deepEqual(g.col3.slice(0, 2), [70, 61]);
  assert.deepEqual(g.col5.slice(-2), [23, 11]);
});

check('columns read top to bottom, pairs left then right', () => {
  const p = (n) => getSeatPositionConfig(n);
  assert.ok(p(95).y < p(85).y, 'left wall: 95 at the top');
  assert.ok(p(10).y < p(1).y, 'right wall: 10 at the top');
  assert.ok(p(70).x < p(61).x && p(70).y === p(61).y, '70 | 61 share a row');
  assert.ok(p(84).x < p(80).x, 'bottom row runs 84 → 80');
  assert.equal(partnerSeat(52), 42);
  assert.equal(partnerSeat(11), 23);
  assert.equal(partnerSeat(79), null);
  assert.equal(p(95).face, 'left');
  assert.equal(p(1).face, 'right');
  assert.equal(p(79).face, 'right', 'Column 2 chairs on the left');
  assert.equal(p(84).face, 'down', 'bottom row chairs behind, towards the room');
});

check('paired tables face each other: chairs on the outer left and right', () => {
  for (const [l, r] of [[70, 61], [62, 53], [52, 42], [43, 33], [32, 20], [23, 11]]) {
    assert.equal(getSeatPositionConfig(l).face, 'right', `${l} faces its partner`);
    assert.equal(getSeatPositionConfig(r).face, 'left', `${r} faces its partner`);
    const cl = chairRect(l), cr = chairRect(r);
    assert.ok(cl.x + cl.w <= getSeatPositionConfig(l).x, `${l}'s chair is left of its desk`);
    assert.ok(cr.x >= getSeatPositionConfig(r).x + DESK_W, `${r}'s chair is right of its desk`);
  }
});

check('no two desks overlap, and all sit inside the walls', () => {
  const boxes = allSeatSlots().map((s) => ({ seat: s.seat, l: s.x, r: s.x + DESK_W, t: s.y, b: s.y + DESK_H }));
  for (const a of boxes) {
    assert.ok(a.l > ROOM.WALL && a.r < ROOM.WIDTH - ROOM.WALL && a.t > ROOM.WALL && a.b < ROOM.HEIGHT - ROOM.WALL, `seat ${a.seat} is outside the room`);
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const ox = Math.min(a.r, b.r) - Math.max(a.l, b.l);
      const oy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      assert.ok(ox <= 0 || oy <= 0, `seats ${a.seat} and ${b.seat} overlap`);
    }
  }
});

check('every chair has its own clear space — never under a desk or another chair', () => {
  // The bug this guards: a 6px row gap left each chair hidden under the
  // desk in front of it, with only a sliver of black showing.
  const desks = allSeatSlots().map((d) => ({ seat: d.seat, l: d.x, r: d.x + DESK_W, t: d.y, b: d.y + DESK_H }));
  const chairs = SEAT_NUMBERS.map((n) => { const c = chairRect(n); return { seat: n, l: c.x, r: c.x + c.w, t: c.y, b: c.y + c.h }; });
  const hit = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 0 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 0;
  for (const c of chairs) {
    assert.ok(c.l > ROOM.WALL && c.r < ROOM.WIDTH - ROOM.WALL && c.t > ROOM.WALL && c.b < ROOM.HEIGHT - ROOM.WALL, `chair ${c.seat} is outside the room`);
    for (const d of desks) assert.ok(!hit(c, d), `chair ${c.seat} is under desk ${d.seat}`);
    for (const o of chairs) if (o.seat !== c.seat) assert.ok(!hit(c, o), `chairs ${c.seat} and ${o.seat} overlap`);
  }
});

// ─── Seat map keyboard navigation ────────────────────────────────
const ALL_SEATS = SEAT_NUMBERS;

check('arrow nav moves down a column one seat at a time', () => {
  assert.equal(nextSeatInDirection(95, 'down', ALL_SEATS), 94);
  assert.equal(nextSeatInDirection(61, 'down', ALL_SEATS), 60);
  assert.equal(nextSeatInDirection(1, 'up', ALL_SEATS), 2);
});

check('arrow nav crosses the table, then the aisle', () => {
  assert.equal(nextSeatInDirection(70, 'right', ALL_SEATS), 61);
  assert.equal(nextSeatInDirection(61, 'right', ALL_SEATS), 52);
  assert.equal(nextSeatInDirection(95, 'right', ALL_SEATS), 79);
});

check('arrow nav stops at the edge instead of wrapping', () => {
  assert.equal(nextSeatInDirection(95, 'up', ALL_SEATS), null);
  assert.equal(nextSeatInDirection(95, 'left', ALL_SEATS), null);
  assert.equal(nextSeatInDirection(10, 'right', ALL_SEATS), null);
  assert.equal(nextSeatInDirection(1, 'down', ALL_SEATS), null);
});

check('arrow nav only considers seats that are rendered', () => {
  // With a filter applied the map renders a subset; nav must not focus a seat
  // that is not on screen.
  // Right wall runs 10 (top) down to 1.
  assert.equal(nextSeatInDirection(10, 'down', [10, 6, 2]), 6);
  assert.equal(nextSeatInDirection(10, 'down', [10]), null);
});

check('short dates keep the year when it is not this year', () => {
  const thisYear = new Date().getFullYear();
  // Same year: short, no year — the common case on a members table.
  assert.equal(/\d{4}/.test(fmtDateShort(`${thisYear}-03-04`)), false);
  // A different year must say so, or a 1Y plan reads as expiring the day it
  // started.
  assert.match(fmtDateShort(`${thisYear + 1}-03-04`), new RegExp(String(thisYear + 1)));
  assert.equal(fmtDateShort(''), '—');
  assert.equal(fmtDateShort('not-a-date'), '—');
});


console.log('\nLogging');

// The logger writes to the console by design, so the checks capture it. Every
// assertion below is about a promise the rest of the app relies on: that an id
// is greppable, that it is the SAME id in the log line and the response, and
// that a caller can tie several lines together.
function capture(fn) {
  const lines = [];
  const realError = console.error, realLog = console.log;
  console.error = (l) => lines.push(l);
  console.log = (l) => lines.push(l);
  try { const value = fn(); return { lines, value }; }
  finally { console.error = realError; console.log = realLog; }
}

check('ids are 8 hex chars and do not repeat', () => {
  const ids = new Set();
  for (let i = 0; i < 500; i++) {
    const id = newRequestId();
    assert.match(id, /^[0-9a-f]{8}$/);
    ids.add(id);
  }
  assert.equal(ids.size, 500);
});

check('a log line is one parseable JSON object with the grep fields', () => {
  const { lines, value } = capture(() =>
    logError('GET /api/x', 'Boom', new Error('underlying')));
  assert.equal(lines.length, 1);
  const entry = JSON.parse(lines[0]);
  assert.equal(entry.level, 'error');
  assert.equal(entry.route, 'GET /api/x');
  assert.equal(entry.message, 'Boom');
  assert.equal(entry.errMessage, 'underlying');
  assert.equal(entry.reqId, value);         // returned id === logged id
  assert.ok(entry.stack.includes('Error'));
  assert.ok(!lines[0].includes('\n'));       // one line, so grep finds it whole
});

check('a supplied reqId ties several lines to one request', () => {
  // The reminder cron depends on this: one run, one id, many failures.
  const reqId = newRequestId();
  const { lines } = capture(() => {
    logError('GET /api/cron/reminders', 'Reminder delivery failed', 'no phone', { reqId, seat: 12 });
    logError('GET /api/cron/reminders', 'Reminder delivery failed', 'no phone', { reqId, seat: 41 });
  });
  const ids = lines.map((l) => JSON.parse(l).reqId);
  assert.deepEqual(ids, [reqId, reqId]);
  assert.equal(JSON.parse(lines[1]).seat, 41);   // context survives alongside
});

check('without a supplied reqId each failure gets its own', () => {
  const { lines } = capture(() => { logError('r', 'a'); logError('r', 'b'); });
  const [a, b] = lines.map((l) => JSON.parse(l).reqId);
  assert.notEqual(a, b);
});

check('a non-Error thrown value is still recorded', () => {
  // Routes catch `unknown`; a rejected string must not produce an empty log.
  const { lines } = capture(() => logError('r', 'm', 'plain string failure'));
  assert.equal(JSON.parse(lines[0]).err, 'plain string failure');
});

// Read the body up here: `check` is synchronous, so an async callback's
// assertions would never actually run inside it.
const errRes = capture(() => apiError('GET /api/x', 'Failed to fetch', new Error('e')));
const errBody = await errRes.value.json();

check('apiError returns the same id in the log line, the header and the body', () => {
  const logged = JSON.parse(errRes.lines[0]).reqId;
  assert.equal(errRes.value.status, 500);
  assert.equal(errRes.value.headers.get('x-request-id'), logged);
  assert.equal(errBody.reqId, logged);
  assert.equal(errBody.error, 'Failed to fetch');   // the honest message, not "Internal error"
});

check('apiError honours a non-500 status', () => {
  const { value: res } = capture(() => apiError('GET /api/cron/x', 'Not configured', 'no secret', 503));
  assert.equal(res.status, 503);
});

check('logInfo is level info and goes through the same shape', () => {
  const { lines } = capture(() => logInfo('reminder', 'dry-run', { seat: 7 }));
  const entry = JSON.parse(lines[0]);
  assert.equal(entry.level, 'info');
  assert.equal(entry.seat, 7);
  assert.match(entry.reqId, /^[0-9a-f]{8}$/);
});

console.log(`\n${n} checks passed.\n`);
