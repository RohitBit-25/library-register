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
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIRS = ['app', 'components', 'lib', 'hooks'];
const EXTS = new Set(['.ts', '.tsx', '.css']);

// Injected at runtime by next/font onto <html>, so they are never in globals.css.
const RUNTIME_DEFINED = new Set(['--font-outfit', '--font-dm-mono']);

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

const used = new Map(); // token -> first file that used it
for (const file of SOURCE_DIRS.flatMap((d) => walk(join(root, d)))) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
    if (!used.has(m[1])) used.set(m[1], file.slice(root.length + 1));
  }
}

const missing = [...used.entries()].filter(
  ([token]) => !defined.has(token) && !RUNTIME_DEFINED.has(token)
);

if (missing.length) {
  console.error(`\n${missing.length} CSS token(s) used but never defined:\n`);
  for (const [token, file] of missing) console.error(`  ${token}  (e.g. ${file})`);
  console.error('\nDefine them in app/globals.css or fix the reference.\n');
  process.exit(1);
}

console.log(`All ${used.size} referenced CSS tokens are defined.`);
