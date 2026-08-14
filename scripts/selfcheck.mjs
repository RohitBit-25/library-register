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
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Transpile the TS sources we need into a temp dir, then import them.
const out = mkdtempSync(join(tmpdir(), 'lib-selfcheck-'));
writeFileSync(join(out, 'package.json'), '{"type":"module"}');
// allowImportingTsExtensions + rewriteRelativeImportExtensions: the lib/ files
// import each other with explicit .ts extensions (so plain Node can load them
// in scripts/), and tsc rewrites those to .js on emit.
execFileSync('npx', [
  'tsc', 'lib/csv.ts', 'lib/utils.ts', 'lib/types.ts', 'lib/seat-status.ts',
  'lib/notify.ts', 'lib/pricing.ts', 'lib/layoutConfig.ts',
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

const { nextSeatInDirection, getSeatPositionConfig } =
  await import(pathToFileURL(join(out, 'layoutConfig.js')).href);

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
  assert.notEqual(midnightIST.toISOString().split('T')[0], '2026-08-14');
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

// ─── Seat map keyboard navigation ────────────────────────────────
const ALL_SEATS = Array.from({ length: 95 }, (_, i) => i + 1);

check('arrow nav moves down a run one seat at a time', () => {
  // Seats 1-10 run down column 1.
  assert.equal(nextSeatInDirection(1, 'down', ALL_SEATS), 2);
  assert.equal(nextSeatInDirection(5, 'up', ALL_SEATS), 4);
});

check('arrow nav crosses to the facing run, not diagonally', () => {
  // Seat 11 sits at x=3,y=3; the seat to its right at the same row is 23 (x=4).
  const right = nextSeatInDirection(11, 'right', ALL_SEATS);
  assert.equal(getSeatPositionConfig(right).x, 4);
  assert.equal(getSeatPositionConfig(right).y, getSeatPositionConfig(11).y);
});

check('arrow nav will not teleport across the room', () => {
  // Seats 80-84 are the only ones above seat 1's row, but they sit nine
  // columns away. Pressing Up at seat 1 must do nothing, not jump there.
  assert.equal(nextSeatInDirection(1, 'up', ALL_SEATS), null);
});

check('arrow nav stops at the edge instead of wrapping', () => {
  // Column 14 is the right wall — nothing further right exists.
  assert.equal(nextSeatInDirection(90, 'right', ALL_SEATS), null);
  // Seat 1 is the top of its run and the leftmost column.
  assert.equal(nextSeatInDirection(1, 'left', ALL_SEATS), null);
});

check('arrow nav only considers seats that are rendered', () => {
  // With a filter applied the map renders a subset; nav must not focus a seat
  // that is not on screen.
  assert.equal(nextSeatInDirection(1, 'down', [1, 5, 9]), 5);
  assert.equal(nextSeatInDirection(1, 'down', [1]), null);
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

console.log(`\n${n} checks passed.\n`);
