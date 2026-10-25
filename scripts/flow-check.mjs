#!/usr/bin/env node
/**
 * Workflow checks: the real journeys, end to end, against a running server.
 *
 * api-check.mjs covers the rules (who gets 401, what is rejected). This walks
 * the flows staff and students actually use and checks what lands in the
 * database: request → approve → seat + payment, fee and renewal ledgering,
 * vacate, the full-library waitlist, staff accounts and PINs, the cron jobs.
 *
 * It WIPES requests, payments, attendance, rate limits and non-Admin staff,
 * and resets every seat to vacant. So it only runs against a database on
 * localhost — never the one in .env:
 *
 *   mongod --dbpath /tmp/gangaur-db --port 27099
 *   MONGODB_URI=mongodb://127.0.0.1:27099/gangaur_test node scripts/seed.ts
 *   (build without .env, then)  MONGODB_URI=… ADMIN_SECRET=… ADMIN_PIN=246810 \
 *     CRON_SECRET=test npx next start -p 3300
 *   TEST_MONGODB_URI=mongodb://127.0.0.1:27099/gangaur_test ADMIN_PIN=246810 \
 *     CRON_SECRET=test npm run check:flows
 */
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

const BASE = process.env.BASE || 'http://localhost:3300';
const DB = process.env.TEST_MONGODB_URI || '';
const OWNER_PIN = process.env.ADMIN_PIN || '';
const CRON = process.env.CRON_SECRET || '';
const local = (u) => /^(mongodb|http):\/\/(127\.0\.0\.1|localhost)[:/]/.test(u);
if (!local(DB) || !local(BASE) || !OWNER_PIN || !CRON) {
  console.error('Refusing to run: set TEST_MONGODB_URI and BASE to localhost, plus ADMIN_PIN and CRON_SECRET.');
  process.exit(2);
}
await mongoose.connect(DB);
const db = mongoose.connection.db;

let ok = 0, bad = 0;
async function check(name, fn) {
  try { await fn(); ok++; console.log('  ok   ' + name); }
  catch (e) { bad++; console.log('  FAIL ' + name + '\n       ' + e.message.split('\n')[0]); }
}
let ip = 0;
const caller = () => `198.51.100.${(ip++ % 250) + 1}`;
async function call(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(BASE + path, {
    method, redirect: 'manual',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': caller(), ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, json, setCookie: res.headers.get('set-cookie') };
}
async function login(name, pin) {
  const r = await call('/api/auth', { method: 'POST', body: { name, pin } });
  assert.equal(r.status, 200, `login ${name}: ${r.status} ${JSON.stringify(r.json)}`);
  return r.setCookie.split(';')[0];
}
const payments = (seat) => db.collection('payments').countDocuments(seat ? { seat } : {});
const member = (seat) => db.collection('members').findOne({ seat });
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

// Clean slate for repeat runs.
await db.collection('seatrequests').deleteMany({});
await db.collection('payments').deleteMany({});
await db.collection('attendances').deleteMany({});
await db.collection('ratelimits').deleteMany({});
await db.collection('members').updateMany({}, { $set: { vacant: true, name: '', phone: '', fee: '', expiry: '', joinDate: '', duration: '' } });
await db.collection('staffs').deleteMany({ name: { $ne: 'Admin' } });
await db.collection('staffs').updateMany({}, { $set: { failedAttempts: 0, lockedUntil: null } });

const owner = await login('Admin', OWNER_PIN);

console.log('\nStudent request → approval');
let reqId;
await check('student submits a cash request (201, pending)', async () => {
  const r = await call('/api/requests', { method: 'POST', body: { seat: 41, userName: 'Asha Verma', userPhone: '98765 43210', paymentMode: 'cash', duration: '3M', shift: 'morning', joinDate: today } });
  assert.equal(r.status, 201, JSON.stringify(r.json)); assert.equal(r.json.status, 'pending'); reqId = r.json.id;
});
await check('same student, same seat again is refused (409)', async () => {
  const r = await call('/api/requests', { method: 'POST', body: { seat: 41, userName: 'Asha Verma', userPhone: '9876543210', paymentMode: 'cash' } });
  assert.equal(r.status, 409);
});
await check('my-requests lookup shows status only, no name/ID/UPI ref', async () => {
  const r = await call('/api/requests/my?phone=9876543210');
  assert.equal(r.status, 200); assert.equal(r.json.length, 1);
  for (const k of ['userName', 'documentUrl', 'transactionId', 'message', 'userPhone']) assert.ok(!(k in r.json[0]), `leaks ${k}`);
});
await check('UPI request without reference is refused, with reference accepted', async () => {
  const a = await call('/api/requests', { method: 'POST', body: { seat: 42, userName: 'Ravi', userPhone: '9123456780', paymentMode: 'upi' } });
  assert.equal(a.status, 400);
  const b = await call('/api/requests', { method: 'POST', body: { seat: 42, userName: 'Ravi', userPhone: '9123456780', paymentMode: 'upi', transactionId: 'UPI12345' } });
  assert.equal(b.status, 201);
});
await check('seat 96 (not on the plan) is refused; 21 by the door is accepted', async () => {
  const r = await call('/api/requests', { method: 'POST', body: { seat: 96, userName: 'X', userPhone: '9000000000', paymentMode: 'cash' } });
  assert.equal(r.status, 400);
  const ok = await call('/api/requests', { method: 'POST', body: { seat: 21, userName: 'Door', userPhone: '9000000003', paymentMode: 'cash' } });
  assert.equal(ok.status, 201, JSON.stringify(ok.json));
});
await check('staff see the request with full details', async () => {
  const r = await call('/api/requests', { cookie: owner });
  assert.equal(r.status, 200); const x = r.json.find((q) => q.id === reqId); assert.equal(x.userName, 'Asha Verma');
});
await check('approving allots the seat, marks paid, sets expiry, logs one payment', async () => {
  const before = await payments(41);
  const r = await call('/api/requests', { method: 'PATCH', cookie: owner, body: { id: reqId, status: 'approved' } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const m = await member(41);
  assert.equal(m.vacant, false); assert.equal(m.name, 'Asha Verma'); assert.equal(m.fee, 'paid'); assert.equal(m.joinDate, today);
  assert.equal(m.expiry, (() => { const [y, mo, d] = today.split('-').map(Number); const t = mo - 1 + 3; const ly = y + Math.floor(t / 12), lm = t % 12; const last = new Date(Date.UTC(ly, lm + 1, 0)).getUTCDate(); return `${ly}-${String(lm + 1).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`; })());
  assert.equal(await payments(41), before + 1);
  const p = await db.collection('payments').findOne({ seat: 41 }); assert.equal(p.date, today); assert.equal(p.paymentMode, 'cash');
});
await check('approving the same request twice does not pay twice', async () => {
  const before = await payments(41);
  const r = await call('/api/requests', { method: 'PATCH', cookie: owner, body: { id: reqId, status: 'approved' } });
  assert.equal(r.status, 200); assert.equal(await payments(41), before);
});
await check('an approved request cannot be flipped to rejected (409)', async () => {
  const r = await call('/api/requests', { method: 'PATCH', cookie: owner, body: { id: reqId, status: 'rejected' } });
  assert.equal(r.status, 409);
});
await check('a new request for the now-occupied seat is refused while others are free', async () => {
  const r = await call('/api/requests', { method: 'POST', body: { seat: 41, userName: 'Late', userPhone: '9111111111', paymentMode: 'cash' } });
  assert.equal(r.status, 409);
});
await check('approving one request moves the others for that seat to the waitlist', async () => {
  const a = await call('/api/requests', { method: 'POST', body: { seat: 60, userName: 'First', userPhone: '9333333331', paymentMode: 'cash' } });
  const b = await call('/api/requests', { method: 'POST', body: { seat: 60, userName: 'Second', userPhone: '9333333332', paymentMode: 'cash' } });
  assert.equal(a.status, 201); assert.equal(b.status, 201);
  const r = await call('/api/requests', { method: 'PATCH', cookie: owner, body: { id: a.json.id, status: 'approved' } });
  assert.equal(r.status, 200); assert.equal(r.json.movedToWaitlist, 1);
  const mine = await call('/api/requests/my?phone=9333333332');
  assert.equal(mine.json[0].status, 'waitlisted');
  await call('/api/members/60', { method: 'DELETE', cookie: owner });
});
await check('the staff list leaves ID images out; one is loaded on request and logged', async () => {
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const r = await call('/api/requests', { method: 'POST', body: { seat: 70, userName: 'With ID', userPhone: '9444444441', paymentMode: 'cash', documentUrl: png } });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  const list = (await call('/api/requests', { cookie: owner })).json;
  const row = list.find((x) => x.id === r.json.id);
  assert.equal(row.hasDocument, true); assert.ok(!('documentUrl' in row), 'list still carries the image');
  const doc = await call(`/api/requests/${r.json.id}/document`, { cookie: owner });
  assert.equal(doc.status, 200); assert.equal(doc.json.documentUrl, png);
  assert.equal((await call(`/api/requests/${r.json.id}/document`)).status, 401, 'visitors must not get IDs');
  assert.ok(await db.collection('auditlogs').findOne({ action: 'Viewed ID Document', seat: 70 }));
});
await check('rejecting a request leaves the seat empty and logs it', async () => {
  const list = (await call('/api/requests', { cookie: owner })).json;
  const q = list.find((x) => x.seat === 42 && x.status === 'pending');
  const r = await call('/api/requests', { method: 'PATCH', cookie: owner, body: { id: q.id, status: 'rejected' } });
  assert.equal(r.status, 200); assert.equal((await member(42)).vacant, true);
  assert.ok(await db.collection('auditlogs').findOne({ action: 'Rejected Request', seat: 42 }));
});
await check('deleting a request removes it; a bad id is a 400 not a 500', async () => {
  const list = (await call('/api/requests', { cookie: owner })).json;
  const q = list.find((x) => x.seat === 42);
  assert.equal((await call('/api/requests?id=' + q.id, { method: 'DELETE', cookie: owner })).status, 200);
  assert.equal((await call('/api/requests?id=nope', { method: 'DELETE', cookie: owner })).status, 400);
});

console.log('\nStaff desk: add, fees, renew, edit, vacate');
await check('Add member allots a vacant seat and ledgers the paid fee', async () => {
  const r = await call('/api/members/10', { method: 'PATCH', cookie: owner, body: { name: 'Kiran Rao', phone: '9988776655', shift: 'full', joinDate: today, duration: '1M', expiry: '2099-01-01', fee: 'paid', paymentMode: 'upi', documentStatus: '', termsAccepted: true, vacant: false } });
  assert.equal(r.status, 200, JSON.stringify(r.json)); assert.equal(await payments(10), 1);
});
await check('adding onto an occupied seat is refused (409), nothing overwritten', async () => {
  const r = await call('/api/members/10', { method: 'PATCH', cookie: owner, body: { name: 'Intruder', phone: '9000000001', vacant: false } });
  assert.equal(r.status, 409); assert.equal((await member(10)).name, 'Kiran Rao');
});
await check('marking due → no payment; due → paid → one payment; paid again → none', async () => {
  const p0 = await payments(10);
  assert.equal((await call('/api/members/10', { method: 'PATCH', cookie: owner, body: { fee: 'due' } })).status, 200);
  assert.equal(await payments(10), p0);
  assert.equal((await call('/api/members/10', { method: 'PATCH', cookie: owner, body: { fee: 'paid' } })).status, 200);
  assert.equal(await payments(10), p0 + 1);
  assert.equal((await call('/api/members/10', { method: 'PATCH', cookie: owner, body: { fee: 'paid' } })).status, 200);
  assert.equal(await payments(10), p0 + 1);
});
await check('renewal ledgers a payment once, even if the request is retried', async () => {
  const p0 = await payments(10);
  const body = { joinDate: '2099-01-01', duration: '3M', expiry: '2099-04-01', fee: 'paid', renewal: true };
  assert.equal((await call('/api/members/10', { method: 'PATCH', cookie: owner, body })).status, 200);
  assert.equal((await call('/api/members/10', { method: 'PATCH', cookie: owner, body })).status, 200);
  assert.equal(await payments(10), p0 + 1);
  const p = await db.collection('payments').find({ seat: 10 }).sort({ _id: -1 }).limit(1).next();
  assert.equal(p.amount > 0, true); assert.equal(p.duration, '3M');
});
await check('edit rejects a bad phone and an unknown field', async () => {
  assert.equal((await call('/api/members/10', { method: 'PATCH', cookie: owner, body: { phone: '123' } })).status, 400);
  assert.equal((await call('/api/members/10', { method: 'PATCH', cookie: owner, body: { isAdmin: true } })).status, 400);
});
await check('payments ledger filters by seat and totals', async () => {
  const r = await call('/api/payments?seat=10', { cookie: owner });
  assert.equal(r.status, 200); assert.equal(r.json.count, await payments(10));
  assert.equal(r.json.total, r.json.payments.reduce((a, p) => a + p.amount, 0));
});
await check('stats count the two occupied seats and today\'s collections', async () => {
  const r = await call('/api/stats', { cookie: owner });
  assert.equal(r.status, 200); assert.equal(r.json.occupied, 2); assert.equal(r.json.total, 95);
  assert.ok(r.json.revenue.collectedThisMonth > 0); assert.equal(r.json.asOf, today);
});
await check('attendance: present, absent, and whole-day', async () => {
  let r = await call('/api/attendance', { method: 'POST', cookie: owner, body: { date: today, seat: 10, present: true } });
  assert.deepEqual(r.json.seats, [10]);
  r = await call('/api/attendance', { method: 'POST', cookie: owner, body: { date: today, seat: 10, present: false } });
  assert.deepEqual(r.json.seats, []);
  r = await call('/api/attendance', { method: 'POST', cookie: owner, body: { date: today, seats: [10, 41, 41], allPresent: true } });
  assert.deepEqual(r.json.seats.sort((a, b) => a - b), [10, 41]);
});
await check('vacating clears the member and is audited', async () => {
  const r = await call('/api/members/10', { method: 'DELETE', cookie: owner });
  assert.equal(r.status, 200); const m = await member(10);
  assert.equal(m.vacant, true); assert.equal(m.name, ''); assert.equal(m.phone, '');
  assert.ok(await db.collection('auditlogs').findOne({ action: 'Vacated Seat', seat: 10 }));
});

console.log('\nAmounts actually paid');
const lastPayment = (seat) => db.collection('payments').find({ seat }).sort({ _id: -1 }).limit(1).next();
await check('Add member records the amount typed, not the plan price', async () => {
  const r = await call('/api/members/11', { method: 'PATCH', cookie: owner, body: { name: 'Discount', phone: '9777777771', joinDate: today, duration: '1M', expiry: '2099-01-01', fee: 'paid', paymentMode: 'cash', vacant: false, amount: 650 } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal((await lastPayment(11)).amount, 650);
  assert.equal((await member(11)).lastPaymentAmount, 650);
  assert.ok(!('amount' in (await member(11))), 'amount must not be stored on the member');
});
await check('a renewal records its typed amount; without one, the plan price', async () => {
  await call('/api/members/11', { method: 'PATCH', cookie: owner, body: { joinDate: '2099-01-01', duration: '3M', expiry: '2099-04-01', fee: 'paid', renewal: true, amount: 1700 } });
  assert.equal((await lastPayment(11)).amount, 1700);
  await call('/api/members/11', { method: 'PATCH', cookie: owner, body: { joinDate: '2099-04-01', duration: '1M', expiry: '2099-05-01', fee: 'paid', renewal: true } });
  assert.equal((await lastPayment(11)).amount, 700);
});
await check('a zero, negative or fractional amount is refused', async () => {
  for (const amount of [0, -5, 12.5, '100']) {
    const r = await call('/api/members/11', { method: 'PATCH', cookie: owner, body: { fee: 'paid', amount } });
    assert.equal(r.status, 400, `amount ${amount} gave ${r.status}`);
  }
  await call('/api/members/11', { method: 'DELETE', cookie: owner });
});
await check('a student\'s UPI amount is what approval records', async () => {
  const q = await call('/api/requests', { method: 'POST', body: { seat: 12, userName: 'Part Pay', userPhone: '9777777772', paymentMode: 'upi', transactionId: 'UPI999', duration: '3M', amount: 1500 } });
  assert.equal(q.status, 201, JSON.stringify(q.json));
  const list = (await call('/api/requests', { cookie: owner })).json;
  assert.equal(list.find((x) => x.id === q.json.id).amount, 1500);
  assert.equal((await call('/api/requests', { method: 'PATCH', cookie: owner, body: { id: q.json.id, status: 'approved' } })).status, 200);
  assert.equal((await lastPayment(12)).amount, 1500);
  await call('/api/members/12', { method: 'DELETE', cookie: owner });
});

console.log('\nFull library → waitlist');
await check('a full library queues a request, and vacating surfaces the queue', async () => {
  await db.collection('members').updateMany({}, { $set: { vacant: false, name: 'Filler', phone: '9000000002', fee: 'paid', expiry: '2099-01-01' } });
  const r = await call('/api/requests', { method: 'POST', body: { seat: 5, userName: 'Wait Lister', userPhone: '9222222222', paymentMode: 'cash' } });
  assert.equal(r.status, 201, JSON.stringify(r.json)); assert.equal(r.json.waitlisted, true);
  const v = await call('/api/members/5', { method: 'DELETE', cookie: owner });
  assert.equal(v.status, 200); assert.ok(v.json.waitlist.some((w) => w.userName === 'Wait Lister'));
  await db.collection('members').updateMany({}, { $set: { vacant: true, name: '', phone: '', fee: '', expiry: '' } });
});

console.log('\nStaff accounts and PINs');
let staffCookie, staffId;
await check('owner adds a staff member; a duplicate name is refused, a shared PIN is fine', async () => {
  const r = await call('/api/staff', { method: 'POST', cookie: owner, body: { name: 'Meena', pin: '1357', role: 'staff' } });
  assert.equal(r.status, 201, JSON.stringify(r.json)); staffId = r.json.id;
  assert.equal((await call('/api/staff', { method: 'POST', cookie: owner, body: { name: ' meena ', pin: '8642' } })).status, 409);
  assert.equal((await call('/api/staff', { method: 'POST', cookie: owner, body: { name: 'Dev', pin: '1357' } })).status, 201);
  await login('Dev', '1357');
});
await check('a wrong PIN only counts against the account it names', async () => {
  for (let i = 0; i < 5; i++) await call('/api/auth', { method: 'POST', body: { name: 'Dev', pin: '0000' } });
  assert.equal((await call('/api/auth', { method: 'POST', body: { name: 'Dev', pin: '1357' } })).status, 429, 'Dev should be locked');
  await login('Admin', OWNER_PIN);
  await login('Meena', '1357');
});
await check('names are matched ignoring case and spaces; unknown names get the same answer as wrong PINs', async () => {
  await login('  MEENA ', '1357');
  const a = await call('/api/auth', { method: 'POST', body: { name: 'Nobody', pin: '1357' } });
  const b = await call('/api/auth', { method: 'POST', body: { name: 'Meena', pin: '9999' } });
  assert.equal(a.status, 401); assert.equal(b.status, 401); assert.equal(a.json.error, b.json.error);
  await login('Meena', '1357');
});
await check('staff can sign in, but cannot add staff (403)', async () => {
  staffCookie = await login('Meena', '1357');
  assert.equal((await call('/api/staff', { method: 'POST', cookie: staffCookie, body: { name: 'Nope', pin: '9999' } })).status, 403);
});
await check('staff changes own PIN; old PIN stops working, new one works', async () => {
  const r = await call('/api/auth/pin', { method: 'POST', cookie: staffCookie, body: { currentPin: '1357', newPin: '2468' } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal((await call('/api/auth', { method: 'POST', body: { name: 'Meena', pin: '1357' } })).status, 401);
  staffCookie = await login('Meena', '2468');
});
await check('deactivating staff kills their existing session at once', async () => {
  assert.equal((await call('/api/stats', { cookie: staffCookie })).status, 200);
  assert.equal((await call('/api/staff', { method: 'PATCH', cookie: owner, body: { id: staffId, active: false } })).status, 200);
  assert.equal((await call('/api/stats', { cookie: staffCookie })).status, 401);
});
await check('the last owner cannot deactivate themselves', async () => {
  const me = (await call('/api/staff', { cookie: owner })).json.find((s) => s.role === 'owner');
  assert.equal((await call('/api/staff', { method: 'PATCH', cookie: owner, body: { id: me.id, active: false } })).status, 400);
});
await check('signing out revokes the token even if someone kept a copy', async () => {
  const c = await login('Admin', OWNER_PIN);
  assert.equal((await call('/api/auth/logout', { method: 'POST', cookie: c })).status, 200);
  assert.equal((await call('/api/stats', { cookie: c })).status, 401);
});

console.log('\nScheduled jobs');
for (const job of ['snapshot', 'reminders', 'purge-documents']) {
  await check(`cron ${job} runs with the secret, refuses without`, async () => {
    assert.equal((await call('/api/cron/' + job)).status, 401);
    const r = await fetch(BASE + '/api/cron/' + job, { headers: { authorization: `Bearer ${CRON}` } });
    assert.equal(r.status, 200, await r.text());
  });
}
await check('reminders without WhatsApp connected mark nobody as reminded', async () => {
  const soon = new Date(Date.now() + 2 * 864e5);
  const expiry = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(soon);
  await db.collection('members').updateOne({ seat: 50 }, { $set: { vacant: false, name: 'Soon', phone: '9555555551', fee: 'paid', expiry, reminderSentFor: '' } });
  const r = await fetch(BASE + '/api/cron/reminders', { headers: { authorization: `Bearer ${CRON}` } });
  const body = await r.json();
  assert.equal(r.status, 200); assert.ok(body.dryRun >= 1, JSON.stringify(body)); assert.equal(body.sent, 0);
  assert.equal((await member(50)).reminderSentFor, '');
  await db.collection('members').updateOne({ seat: 50 }, { $set: { vacant: true, name: '', phone: '', fee: '', expiry: '' } });
});
await check('snapshot writes today\'s row (India date)', async () => {
  assert.ok(await db.collection('occupancysnapshots').findOne({ date: today }));
});
await check('audit log lists recent actions with the staff name', async () => {
  const r = await call('/api/audit', { cookie: owner });
  assert.equal(r.status, 200); assert.ok(r.json.some((a) => a.user === 'Admin' && a.action === 'Approved Request'));
});

console.log(`\n${ok} passed, ${bad} failed.`);
await mongoose.disconnect();
process.exit(bad ? 1 : 0);
