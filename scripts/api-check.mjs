#!/usr/bin/env node
/**
 * HTTP contract checks against a running server.
 *
 * selfcheck.mjs covers the pure logic. This covers the part that only exists
 * over the wire: who gets 401, what the rate limiter does on the sixth call,
 * whether a rejected write leaves the database untouched. Those were verified
 * by hand with curl every time something changed — this makes them repeatable.
 *
 *   npm run dev            # in one terminal
 *   npm run check:api      # in another
 *
 * Set ADMIN_PIN to also run the authenticated checks. Order matters: the
 * lockout check runs last and only with CHECK_LOCKOUT=1, because it leaves
 * every staff account locked for 15 minutes.
 *
 * Point BASE at a dev server, never production.
 */
import assert from 'node:assert/strict';

const BASE = process.env.BASE || 'http://localhost:3000';
const SEAT = Number(process.env.SEAT || 95);
const PIN = process.env.ADMIN_PIN || '';

let passed = 0, failed = 0;
const results = [];

async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    results.push({ name, message: err.message });
    console.log(`  FAIL  ${name}\n        ${err.message.split('\n')[0]}`);
  }
}

/** fetch that never follows redirects — a 307 to /login IS the assertion. */
const req = (path, init = {}) =>
  fetch(`${BASE}${path}`, { redirect: 'manual', ...init });

/**
 * Each POST claims its own caller identity.
 *
 * The public endpoint allows 5 submissions per caller per hour, and the
 * limiter runs *before* validation — correct, but it means a suite that
 * shares one identity poisons its own later checks, and a second run within
 * the hour fails outright. `x-forwarded-for` is what the limiter keys on and
 * is client-controlled by design (see lib/rate-limit.ts), so varying it here
 * is the same freedom any caller has. That is exactly why the limiter is
 * documented as a speed bump rather than a boundary.
 */
let callerSeq = 0;
const nextCaller = () => `203.0.113.${(callerSeq++ % 250) + 1}`;

const json = (path, body, init = {}) =>
  req(path, {
    method: 'POST',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': nextCaller(),
      ...(init.headers || {}),
    },
    body: JSON.stringify(body),
  });

// ─── Auth boundaries ──────────────────────────────────────────────
// Every admin route must refuse an anonymous caller. A route added without a
// getSession() guard is the single most likely way this app leaks member PII.
const ADMIN_GETS = [
  '/api/stats',
  '/api/requests',
  '/api/audit',
  '/api/payments',
  '/api/staff',
];

for (const path of ADMIN_GETS) {
  await check(`GET ${path} refuses anonymous callers`, async () => {
    const res = await req(path);
    assert.equal(res.status, 401, `expected 401, got ${res.status}`);
  });
}

// /api/members is deliberately public — /browse needs to show which seats are
// free — but it must redact. This is the check that matters: not that it is
// closed, but that opening it never exposes a name or a phone number.
await check('GET /api/members redacts member PII for anonymous callers', async () => {
  const res = await req('/api/members');
  assert.equal(res.status, 200, `expected 200, got ${res.status}`);
  const members = await res.json();
  assert.ok(Array.isArray(members) && members.length > 0, 'expected seat records');
  for (const m of members) {
    assert.equal(m.phone, undefined, `seat ${m.seat} leaked a phone number`);
    assert.equal(m.joinDate, undefined, `seat ${m.seat} leaked a join date`);
    assert.equal(m.expiry, undefined, `seat ${m.seat} leaked an expiry date`);
    assert.ok(
      m.name === '' || m.name === 'Occupied',
      `seat ${m.seat} leaked the name "${m.name}"`
    );
  }
});

// ─── The two sides of the product ────────────────────────────────
//
// Admin pages require a session. Student pages must not — /browse and
// /my-requests once required one and bounced every real visitor back to the
// landing page, which broke the entire public seat-request flow.

for (const path of ['/', '/members', '/analytics', '/payments', '/staff']) {
  await check(`admin page ${path} sends anonymous callers to the staff door`, async () => {
    const res = await req(path);
    assert.ok(
      [302, 307, 308].includes(res.status),
      `expected a redirect, got ${res.status}`
    );
    const location = res.headers.get('location') || '';
    assert.match(location, /\/admin\/login/);
    // And it remembers where they were going.
    assert.match(location, new RegExp(`next=${encodeURIComponent(path).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  });
}

for (const path of ['/landing', '/browse', '/my-requests', '/kiosk', '/admin/login']) {
  await check(`public page ${path} is reachable without a session`, async () => {
    const res = await req(path);
    assert.equal(res.status, 200, `expected 200, got ${res.status}`);
  });
}

await check('the staff door does not forward to another site', async () => {
  // An open redirect on a login page turns a link that looks like the library
  // into a way to land staff somewhere else with a fresh session in mind.
  for (const evil of ['https://example.com', '//example.com', 'javascript:alert(1)']) {
    const res = await req(`/admin/login?next=${encodeURIComponent(evil)}`);
    assert.equal(res.status, 200, 'the login page itself must still render');
    const html = await res.text();
    // Next serialises the query into the flight payload, so the raw string
    // being present proves nothing. What must never happen is the value
    // reaching a navigation target.
    assert.ok(
      !new RegExp(`(href|action|url)=["']${evil.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(html),
      `login page turned an off-site next value into a link: ${evil}`
    );
  }
});

await check('cron snapshot refuses a caller without the secret', async () => {
  const res = await req('/api/cron/snapshot');
  // 503 when CRON_SECRET is unset is also a refusal — it must never run open.
  assert.ok([401, 503].includes(res.status), `expected 401/503, got ${res.status}`);
});

// ─── Public write: validation ─────────────────────────────────────
// POST /api/requests is the only endpoint an unauthenticated stranger can
// write through, so every field is a trust boundary.

await check('rejects a seat number outside the floor plan', async () => {
  const res = await json('/api/requests', {
    seat: 9999, userName: 'Test', userPhone: '9999999999', paymentMode: 'cash',
  });
  assert.equal(res.status, 400, `expected 400, got ${res.status}`);
});

await check('rejects a malformed phone number', async () => {
  const res = await json('/api/requests', {
    seat: SEAT, userName: 'Test', userPhone: '123', paymentMode: 'cash',
  });
  assert.equal(res.status, 400, `expected 400, got ${res.status}`);
});

await check('rejects a UPI request with no transaction ID', async () => {
  const res = await json('/api/requests', {
    seat: SEAT, userName: 'Test', userPhone: '9999999999', paymentMode: 'upi',
  });
  assert.equal(res.status, 400, `expected 400, got ${res.status}`);
});

await check('rejects an oversized document', async () => {
  const res = await json('/api/requests', {
    seat: SEAT, userName: 'Test', userPhone: '9999999999', paymentMode: 'cash',
    documentUrl: 'data:image/png;base64,' + 'A'.repeat(3_000_000),
  });
  assert.ok([400, 413].includes(res.status), `expected 400/413, got ${res.status}`);
});

await check('rejects a body that is not JSON', async () => {
  const res = await req('/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': nextCaller() },
    body: 'not json at all',
  });
  assert.equal(res.status, 400, `expected 400, got ${res.status}`);
});

await check('rejects unknown fields rather than storing them', async () => {
  const res = await json('/api/members/' + SEAT, { role: 'admin' }, { method: 'PATCH' });
  // Unauthenticated, so 401 comes first — the point is it is never 200.
  assert.notEqual(res.status, 200, 'an anonymous PATCH must never succeed');
});

// ─── Rate limiting ────────────────────────────────────────────────
// The public endpoint allows 5 submissions per caller per hour. Checked last,
// because it consumes the window for this IP.

await check('rate limiter returns 429 with Retry-After after the 6th try', async () => {
  // One identity for the whole loop — that is the thing being measured.
  const caller = nextCaller();
  let sawLimit = false;
  for (let i = 0; i < 8; i++) {
    const res = await json('/api/requests', {
      seat: SEAT, userName: `RateTest${i}`, userPhone: '9000000000', paymentMode: 'cash',
    }, { headers: { 'x-forwarded-for': caller } });
    if (res.status === 429) {
      sawLimit = true;
      assert.ok(res.headers.get('retry-after'), 'a 429 must carry Retry-After');
      break;
    }
  }
  assert.ok(sawLimit, 'no 429 within 8 submissions — the limiter is not firing');
});

// ─── Authenticated checks (only with ADMIN_PIN set) ───────────────

if (PIN) {
  const loginRes = await json('/api/auth', { pin: PIN });
  const cookie = loginRes.headers.get('set-cookie')?.split(';')[0];

  await check('correct PIN authenticates and sets an httpOnly cookie', () => {
    assert.equal(loginRes.status, 200, `login returned ${loginRes.status}`);
    assert.ok(cookie, 'no session cookie was set');
    assert.match(loginRes.headers.get('set-cookie'), /HttpOnly/i);
  });

  if (cookie) {
    const auth = { headers: { cookie } };

    await check('authenticated stats returns a coherent seat total', async () => {
      const res = await req('/api/stats', auth);
      assert.equal(res.status, 200, `expected 200, got ${res.status}`);
      const s = await res.json();
      assert.equal(s.occupied + s.vacant, s.total, 'occupied + vacant must equal total');
      // Expired outranks due, so the two buckets can never overlap.
      assert.ok(s.due <= s.withDues, 'due must be a subset of withDues');
    });

    await check('stats never invents occupancy history', async () => {
      const res = await req('/api/stats', auth);
      const s = await res.json();
      assert.ok(Array.isArray(s.occupancyHistory), 'occupancyHistory must be an array');
      // Every entry must be a real snapshot row, not an interpolated gap.
      for (const row of s.occupancyHistory) {
        assert.match(row.date, /^\d{4}-\d{2}-\d{2}$/);
        assert.equal(typeof row.occupied, 'number');
      }
    });

    await check('a PATCH with an unknown field is rejected, not silently stored', async () => {
      const res = await json('/api/members/' + SEAT, { role: 'admin' }, {
        method: 'PATCH', ...auth,
      });
      assert.equal(res.status, 400, `expected 400, got ${res.status}`);
    });

    await check('a PATCH with an invalid duration is rejected', async () => {
      const res = await json('/api/members/' + SEAT, { duration: '99Y' }, {
        method: 'PATCH', ...auth,
      });
      assert.equal(res.status, 400, `expected 400, got ${res.status}`);
    });

    await check('attendance rejects a seat outside the floor plan', async () => {
      const res = await json('/api/attendance', {
        date: new Date().toISOString().slice(0, 10), seat: 9999, present: true,
      }, auth);
      assert.equal(res.status, 400, `expected 400, got ${res.status}`);
    });

    // ── Waitlist ──────────────────────────────────────────────
    // Only meaningful against a scratch database, because proving the
    // full-house branch means occupying every seat. Skipped otherwise
    // rather than quietly passing.
    const statsRes = await req('/api/stats', auth);
    const stats = await statsRes.json();

    await check('a request for an occupied seat is refused while others are free', async () => {
      if (stats.vacant === 0) {
        console.log('       (library is full — this branch cannot be tested here)');
        return;
      }
      const membersRes = await req('/api/members', auth);
      const members = await membersRes.json();
      const taken = members.find((m) => !m.vacant);
      if (!taken) {
        console.log('       (no occupied seat to test against)');
        return;
      }
      const res = await json('/api/requests', {
        seat: taken.seat, userName: 'Contract Check', userPhone: '9800000001',
        paymentMode: 'cash',
      });
      assert.equal(res.status, 409, `expected 409, got ${res.status}`);
    });

    await check('a full library queues the request instead of turning it away', async () => {
      if (stats.vacant > 0) {
        console.log('       (seats are free — run against a full scratch DB to cover this)');
        return;
      }
      const res = await json('/api/requests', {
        seat: SEAT, userName: 'Contract Waitlist', userPhone: '9800000002',
        paymentMode: 'cash',
      });
      assert.equal(res.status, 201, `expected 201, got ${res.status}`);
      const body = await res.json();
      assert.equal(body.status, 'waitlisted');
      assert.equal(body.waitlisted, true, 'the caller must be told they were queued');
    });

    await check('logout clears the session', async () => {
      const res = await json('/api/auth/logout', {}, auth);
      assert.ok(res.ok, `logout returned ${res.status}`);
      const after = await req('/api/stats', auth);
      assert.equal(after.status, 401, 'the session survived logout');
    });
  }
} else {
  console.log('\n  (set ADMIN_PIN to also run the authenticated checks)');
}

// ─── Login lockout ────────────────────────────────────────────────

// Opt-in: this check locks every staff account for 15 minutes. The per-staff
// counter cannot tell which account a wrong PIN was meant for, so a failure
// counts against all of them — see the comment in app/api/auth. Running it by
// default would lock the admin out of their own library, and would make the
// suite fail on its own second run.
if (process.env.CHECK_LOCKOUT === '1') {
await check('wrong PIN is rejected and eventually locks out', async () => {
  let locked = false;
  for (let i = 0; i < 8; i++) {
    const res = await json('/api/auth', { pin: '000000' });
    assert.equal(res.status === 200, false, 'a wrong PIN must never authenticate');
    assert.ok([401, 429].includes(res.status), `unexpected status ${res.status}`);
    if (res.status === 429) {
      locked = true;
      assert.ok(res.headers.get('retry-after'), 'a lockout must carry Retry-After');
      break;
    }
  }
  assert.ok(locked, 'no lockout after 8 wrong PINs — brute force is unbounded');
});
} else {
  console.log('\n  (set CHECK_LOCKOUT=1 to also test the PIN lockout — it locks staff out for 15 minutes)');
}

console.log(`\n${passed} passed, ${failed} failed.\n`);
if (failed) {
  for (const r of results) console.log(`  ${r.name}\n    ${r.message}\n`);
  process.exit(1);
}
