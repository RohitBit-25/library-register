#!/usr/bin/env node
/**
 * UI gate: the checks from the October UI review, repeatable.
 *
 * For each page at a phone and a desktop width it fails on
 *   - axe violations of impact serious or critical,
 *   - sideways scroll (the page wider than the screen),
 *   - visible tap targets under 24×24 px (WCAG 2.5.8),
 *   - errors in the browser console.
 *
 * It only reads: pages are loaded, nothing is clicked. Staff pages are checked
 * too when ADMIN_NAME and ADMIN_PIN are set (that signs in once, which the
 * audit log records). Localhost only.
 *
 * Needs Playwright, which is not a project dependency (it pulls a browser):
 *   npm i --no-save playwright && npx playwright install chromium
 *   BASE=http://localhost:3300 node scripts/ui-check.mjs
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:3000';
if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(BASE)) {
  console.error('Refusing to run: BASE must be localhost.');
  process.exit(2);
}

const require = createRequire(import.meta.url);
let chromium, AXE;
try { ({ chromium } = await import('playwright')); }
catch { console.error('Playwright is not installed: npm i --no-save playwright && npx playwright install chromium'); process.exit(2); }
// axe-core comes with eslint-plugin-jsx-a11y, already in devDependencies.
try { AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'); }
catch { console.error('axe-core not found: run npm install'); process.exit(2); }

const PUBLIC = ['/landing', '/browse', '/my-requests', '/kiosk', '/admin/login'];
const STAFF = ['/', '/requests', '/members', '/payments', '/expiry', '/attendance', '/analytics', '/audit', '/staff', '/setup', '/floorplan', '/export', '/kiosk'];
const WIDTHS = [[390, 844], [1280, 800]];

let fails = 0;
const fail = (where, msg) => { fails++; console.log(`  FAIL ${where}: ${msg}`); };

async function audit(page, route, w) {
  const where = `${route} @${w}`;
  const errors = [];
  const onErr = (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 140)); };
  const onCrash = (e) => errors.push(`pageerror: ${e.message.slice(0, 140)}`);
  page.on('console', onErr);
  page.on('pageerror', onCrash);
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.addScriptTag({ content: AXE });
  const axe = await page.evaluate(async () => {
    const r = await window.axe.run(document, { resultTypes: ['violations'] });
    return r.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id} ×${v.nodes.length} (${v.nodes[0].target.join(' ')})`);
  });
  const small = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('a[href], button, [role=button], input:not([type=hidden]), select, [role=radio], [role=tab]')) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (!r.width || !r.height || cs.visibility === 'hidden' || el.closest('[inert], [aria-hidden=true]')) continue;
      // The plan's desks scale with zoom on purpose; inline text links are exempt under 2.5.8.
      if (el.closest('[data-seat]') || (el.tagName === 'A' && cs.display === 'inline')) continue;
      if (r.width < 24 || r.height < 24) out.push(`${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
    }
    return out;
  });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  page.off('console', onErr);
  page.off('pageerror', onCrash);

  const before = fails;
  for (const a of axe) fail(where, `axe ${a}`);
  for (const s of small) fail(where, `small target ${s}`);
  if (overflow > 0) fail(where, `scrolls sideways by ${overflow}px`);
  for (const e of errors) fail(where, `console: ${e}`);
  if (fails === before) console.log(`  ok   ${where}`);
}

const staffName = process.env.ADMIN_NAME, staffPin = process.env.ADMIN_PIN;
const browser = await chromium.launch();
for (const [w, h] of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  for (const r of PUBLIC) await audit(page, r, w);
  if (staffName && staffPin) {
    await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle' });
    await page.getByLabel('Your name').fill(staffName);
    await page.getByLabel('Your PIN').fill(staffPin);
    await page.keyboard.press('Enter');
    await page.waitForURL(BASE + '/');
    for (const r of STAFF) await audit(page, r, w);
  }
  await ctx.close();
}
await browser.close();

if (!staffName) console.log('\n(staff pages skipped: set ADMIN_NAME and ADMIN_PIN to include them)');
console.log(fails ? `\n${fails} problem(s).` : '\nAll clear.');
process.exit(fails ? 1 : 0);
