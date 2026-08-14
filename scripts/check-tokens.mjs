#!/usr/bin/env node
/**
 * Fails if any `var(--token)` used in the app is not defined in globals.css.
 *
 * This is the check that would have caught the 13 undefined colour tokens that
 * made expired and fee-due seat tiles render with no background and no text
 * colour. An undefined custom property makes the whole CSS declaration invalid,
 * so it fails silently — nothing in the build complains.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIRS = ['app', 'components', 'lib', 'hooks'];
const EXTS = new Set(['.ts', '.tsx', '.css']);

// next/font injects its `variable:` names onto <html> at runtime, so they never
// appear in globals.css. Read them from layout.tsx rather than hardcoding, so
// adding a font doesn't trip this check.
function runtimeFontVars(root) {
  const layout = readFileSync(join(root, 'app', 'layout.tsx'), 'utf8');
  return new Set(
    [...layout.matchAll(/variable:\s*["'](--[a-z0-9-]+)["']/gi)].map((m) => m[1])
  );
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue;
      walk(p, out);
    } else if (EXTS.has(extname(p))) {
      out.push(p);
    }
  }
  return out;
}

const css = readFileSync(join(root, 'app', 'globals.css'), 'utf8');
const defined = new Set(
  [...css.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)].map((m) => m[1])
);

/** Drop comments so prose mentioning `var(--token)` isn't read as a reference. */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')  // /* block */ — CSS and JS
    .replace(/^\s*\/\/.*$/gm, '');     // // line — anchored, so URLs survive
}

const used = new Map(); // token -> first file that used it
for (const file of SOURCE_DIRS.flatMap((d) => walk(join(root, d)))) {
  const text = stripComments(readFileSync(file, 'utf8'));
  for (const m of text.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
    if (!used.has(m[1])) used.set(m[1], file.slice(root.length + 1));
  }
}

// A `--color-<name>` in @theme generates `text-<name>`/`bg-<name>` utilities.
// When <name> collides with a built-in Tailwind class, the colour version wins
// and silently repaints text — `--color-base` turned the font-size class
// `text-base` into near-white text on white across 14 elements.
const RESERVED = [
  'base', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl',
  'left', 'right', 'center', 'justify', 'start', 'end', 'top', 'bottom',
  'wrap', 'nowrap', 'balance', 'pretty',
];
const themeBlock = css.match(/@theme[^{]*\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';
const collisions = [...themeBlock.matchAll(/--color-([a-z0-9-]+)\s*:/gi)]
  .map((m) => m[1])
  .filter((name) => RESERVED.includes(name));

if (collisions.length) {
  console.error('\n@theme --color-* names that collide with built-in Tailwind utilities:\n');
  for (const c of collisions) {
    console.error(`  --color-${c}  →  breaks the built-in \`text-${c}\` / \`bg-${c}\` class`);
  }
  console.error('\nRename them, or drop the mapping and use text-[var(--token)] instead.\n');
  process.exit(1);
}

const runtime = runtimeFontVars(root);
const missing = [...used.entries()].filter(
  ([token]) => !defined.has(token) && !runtime.has(token)
);

if (missing.length) {
  console.error(`\n${missing.length} CSS token(s) used but never defined:\n`);
  for (const [token, file] of missing) console.error(`  ${token}  (e.g. ${file})`);
  console.error('\nDefine them in app/globals.css or fix the reference.\n');
  process.exit(1);
}

// ─── Structurally broken arbitrary values ────────────────────────
//
// A bulk find-and-replace across class strings can truncate an arbitrary
// value and leave something that is still valid-looking text but is not a
// class Tailwind will ever generate — `text-[var(--saffron-700)go-600)]`,
// `bg-[var(--saffhire-500)]`, `text-[var(--text-inversen-50)]`. Nothing
// errors; the style simply never applies, which is invisible in a diff and
// easy to miss on screen.
//
// The token check above catches these only when the mangled name is also
// undefined. This catches the shape: a bracketed value whose parentheses do
// not balance, or which contains a stray `)` after the closing one.
const broken = [];
for (const file of SOURCE_DIRS.flatMap((d) => walk(join(root, d)))) {
  if (extname(file) === '.css') continue;
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/(?:^|[\s"'`])((?:[a-z-]+:)*[a-z-]+-\[)([^\]\s]*)\]/g)) {
    const value = m[2];
    const opens = (value.match(/\(/g) || []).length;
    const closes = (value.match(/\)/g) || []).length;
    if (opens !== closes) {
      broken.push([`${m[1]}${value}]`, relative(root, file)]);
    }
  }
}

if (broken.length) {
  console.error(`\n${broken.length} malformed arbitrary value(s) — these never compile to a style:\n`);
  for (const [cls, file] of broken) console.error(`  ${cls}  (${file})`);
  console.error('\nUsually the result of a truncated find-and-replace across a class string.\n');
  process.exit(1);
}

console.log(`All ${used.size} referenced CSS tokens are defined; no malformed arbitrary values.`);
