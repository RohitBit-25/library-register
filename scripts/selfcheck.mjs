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
  'tsc', 'lib/csv.ts', 'lib/utils.ts', 'lib/types.ts', 'lib/seat-status.ts', 'lib/notify.ts',
  '--outDir', out, '--module', 'esnext', '--target', 'es2020',
  '--moduleResolution', 'bundler', '--skipLibCheck',
  '--allowImportingTsExtensions', '--rewriteRelativeImportExtensions',
], { cwd: root, stdio: 'inherit' });

const { escapeCsvValue, toCsv } = await import(pathToFileURL(join(out, 'csv.js')).href);
const { calcExpiry, daysUntilExpiry, firstName, renewalStartDate } =
  await import(pathToFileURL(join(out, 'utils.js')).href);
const { getSeatState, getSeatStatus, todayLocalISO, addDaysISO } =
  await import(pathToFileURL(join(out, 'seat-status.js')).href);
const { buildExpiryMessage, normalisePhone } =
  await import(pathToFileURL(join(out, 'notify.js')).href);

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
  const iso = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
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

check('firstName truncates long names', () => {
  assert.equal(firstName('Rohit Singh'), 'Rohit');
  assert.equal(firstName('Chandrashekhar Rao'), 'Chandr.');
  assert.equal(firstName(''), '');
});

console.log(`\n${n} checks passed.\n`);
