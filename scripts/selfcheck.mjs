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
execFileSync('npx', [
  'tsc', 'lib/csv.ts', 'lib/utils.ts', 'lib/types.ts',
  '--outDir', out, '--module', 'esnext', '--target', 'es2020',
  '--moduleResolution', 'bundler', '--skipLibCheck',
], { cwd: root, stdio: 'inherit' });

const { escapeCsvValue, toCsv } = await import(pathToFileURL(join(out, 'csv.js')).href);
const { calcExpiry, daysUntilExpiry, getSeatStatus, firstName, renewalStartDate } =
  await import(pathToFileURL(join(out, 'utils.js')).href);

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

check('getSeatStatus precedence: vacant > due > expired > expiring > active', () => {
  const iso = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };
  const base = { seat: 1, name: 'A', phone: '', joinDate: '', duration: '3M', shift: 'full' };
  assert.equal(getSeatStatus({ ...base, vacant: true, fee: 'due', expiry: iso(-5) }), 'vacant');
  assert.equal(getSeatStatus({ ...base, vacant: false, fee: 'due', expiry: iso(90) }), 'due');
  assert.equal(getSeatStatus({ ...base, vacant: false, fee: 'paid', expiry: iso(-5) }), 'expired');
  assert.equal(getSeatStatus({ ...base, vacant: false, fee: 'paid', expiry: iso(3) }), 'expiring');
  assert.equal(getSeatStatus({ ...base, vacant: false, fee: 'paid', expiry: iso(90) }), 'active');
});

check('expiring window boundary is 7 days inclusive', () => {
  const iso = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };
  const base = { seat: 1, name: 'A', phone: '', joinDate: '', duration: '3M', shift: 'full', vacant: false, fee: 'paid' };
  assert.equal(getSeatStatus({ ...base, expiry: iso(7) }), 'expiring');
  assert.equal(getSeatStatus({ ...base, expiry: iso(8) }), 'active');
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
