/**
 * Realistic demo data, for reviewing the interface against something that
 * looks like a working library.
 *
 * Run with: node --env-file=.env scripts/seed-demo.ts
 *
 * REFUSES to run unless the database name contains "demo" or "scratch". Every
 * screen in this app is a view over real member records; pointing a data
 * generator at the live register is how a real library loses its register.
 *
 * The data is deliberately uneven: 71 of 95 seats taken, a handful expired, a
 * few overdue, attendance that dips on Sundays, and payments spread across
 * months. Even data hides exactly the layout problems a UI review is looking
 * for — every card the same width, every number the same digit count, no name
 * long enough to wrap.
 */
import mongoose from 'mongoose';
import Member from '../models/Member.ts';
import Attendance from '../models/Attendance.ts';
import Payment from '../models/Payment.ts';
import SeatRequest from '../models/SeatRequest.ts';
import AuditLog from '../models/AuditLog.ts';
import { getDefaultMembers } from '../lib/defaultData.ts';
import { planPrice } from '../lib/pricing.ts';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set.');
  process.exit(1);
}

await mongoose.connect(uri);
const dbName = mongoose.connection.name;
if (!/demo|scratch/i.test(dbName)) {
  console.error(
    `Refusing to seed demo data into "${dbName}".\n` +
    'Point MONGODB_URI at a database whose name contains "demo" or "scratch".'
  );
  await mongoose.disconnect();
  process.exit(1);
}

// Names from the region the library actually serves, with the length variety
// real rosters have — "Om Vyas" next to "Chandraprakash Rathore" is what
// breaks a layout tuned on "John Doe".
const NAMES = [
  'Aarav Sharma', 'Priya Rathore', 'Om Vyas', 'Bhavesh Paliwal', 'Nikita Jain',
  'Chandraprakash Rathore', 'Kavya Menaria', 'Rohit Suthar', 'Meenakshi Purohit',
  'Yash Kothari', 'Ishita Trivedi', 'Devendra Singh Chundawat', 'Anjali Bhatt',
  'Karan Salvi', 'Pooja Ameta', 'Harshvardhan Sisodiya', 'Ritika Nagda',
  'Sahil Khatri', 'Divya Chouhan', 'Manish Lohar', 'Sneha Dangi', 'Vikram Gurjar',
  'Tanya Mehta', 'Arjun Kalal', 'Sakshi Joshi', 'Deepak Regar', 'Neha Bhanawat',
  'Raghav Dashora', 'Simran Kaur Bhatia', 'Mohit Sen', 'Anushka Soni',
  'Lokesh Teli', 'Preeti Sanadhya', 'Ankit Choubisa', 'Gauri Shrimali',
  'Tushar Bhavsar', 'Ridhima Pandya', 'Naveen Jat', 'Aditi Vaishnav',
  'Shubham Mundra', 'Palak Agarwal', 'Rahul Meghwal', 'Khushi Rawal',
  'Jatin Maheshwari', 'Bhoomika Shaktawat', 'Siddharth Nagar', 'Muskan Qureshi',
  'Pankaj Damor', 'Aishwarya Bohra', 'Nitesh Kumawat', 'Vaishnavi Audichya',
  'Dhruv Sompura', 'Kritika Vyas', 'Abhishek Charan', 'Sanya Lodha',
  'Prateek Bapna', 'Isha Ranawat', 'Gaurav Solanki', 'Mahima Tak',
  'Vishal Banjara', 'Aarushi Kumbhat', 'Hemant Gehlot', 'Riya Sukhwal',
  'Kunal Dhakad', 'Swati Ojha', 'Nakul Menaria', 'Pallavi Katara',
  'Ayush Bagora', 'Snehal Bhandari', 'Rajat Vyas', 'Trisha Chittora',
];

// Deterministic pseudo-random, so a rerun produces the same library and a
// screenshot comparison shows design changes rather than data churn.
let seed = 20260813;
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));

const TODAY = new Date('2026-08-13T00:00:00Z');
const iso = (d: Date) => d.toISOString().slice(0, 10);
const shift = (days: number) => {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

const DURATIONS = ['1M', '3M', '6M', '1Y'] as const;
const MONTHS: Record<string, number> = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 };

await Promise.all([
  Member.deleteMany({}), Attendance.deleteMany({}), Payment.deleteMany({}),
  SeatRequest.deleteMany({}), AuditLog.deleteMany({}),
]);
await Member.insertMany(getDefaultMembers());

// 71 of 95 taken — a busy library with room to sell, which is the state the
// dashboard is actually read in. A full house or an empty one hides the
// middle-ground layout problems.
const occupied = new Set<number>();
while (occupied.size < 71) occupied.add(int(1, 95));

const payments: Record<string, unknown>[] = [];
let n = 0;

for (const seatNum of [...occupied].sort((a, b) => a - b)) {
  const name = NAMES[n % NAMES.length];
  n++;
  const duration = pick([...DURATIONS, '3M', '3M', '6M']); // 3M is the common plan
  const months = MONTHS[duration];

  // Spread joins across the year, then push a few past their expiry so the
  // expired and expiring states have something in them.
  let joined: Date;
  const roll = rand();
  if (roll < 0.08) joined = shift(-months * 30 - int(5, 40));   // expired
  else if (roll < 0.20) joined = shift(-months * 30 + int(1, 7)); // expiring soon
  else joined = shift(-int(1, months * 30 - 8));

  const expiry = new Date(joined);
  expiry.setUTCMonth(expiry.getUTCMonth() + months);

  const overdue = expiry < TODAY;
  // Someone whose term ran out is far more likely to be the one who owes.
  const fee = overdue ? (rand() < 0.55 ? 'due' : 'paid') : (rand() < 0.12 ? 'due' : 'paid');
  const mode = rand() < 0.62 ? 'upi' : 'cash';

  await Member.updateOne({ seat: seatNum }, {
    $set: {
      name, phone: `9${int(100000000, 999999999)}`,
      joinDate: iso(joined), duration, expiry: iso(expiry),
      fee, vacant: false,
      shift: rand() < 0.34 ? 'morning' : rand() < 0.6 ? 'evening' : 'full',
      paymentMode: mode, termsAccepted: true,
      documentStatus: rand() < 0.7 ? 'Aadhaar on file' : '',
    },
  });

  if (fee === 'paid') {
    payments.push({
      seat: seatNum, memberName: name, memberPhone: '',
      amount: planPrice(duration), date: iso(joined),
      paymentMode: mode, duration,
    });
    // Renewals — the reason collections must come from a ledger and not a
    // field on the member.
    if (months <= 3 && rand() < 0.45) {
      const renewed = new Date(joined);
      renewed.setUTCMonth(renewed.getUTCMonth() + months);
      if (renewed < TODAY) {
        payments.push({
          seat: seatNum, memberName: name, memberPhone: '',
          amount: planPrice(duration), date: iso(renewed),
          paymentMode: mode, duration,
        });
      }
    }
  }
}

await Payment.insertMany(payments);

// Attendance for the last 45 days. Sundays are quiet, exam season is busy —
// a flat line would make the trend chart look right when it is not.
const seatList = [...occupied];
const attendance = [];
for (let d = 44; d >= 0; d--) {
  const day = shift(-d);
  const isSunday = day.getUTCDay() === 0;
  const base = isSunday ? 0.32 : 0.74;
  const present = seatList.filter(() => rand() < base + (rand() * 0.12 - 0.06));
  attendance.push({ date: iso(day), seats: present });
}
await Attendance.insertMany(attendance);

const vacantSeats = [...Array(95).keys()].map((i) => i + 1).filter((s) => !occupied.has(s));
await SeatRequest.insertMany([
  {
    seat: vacantSeats[0], userName: 'Mansi Dadhich', userPhone: '9784512360',
    message: 'Preparing for RAS mains, need a morning seat near a window.',
    joinDate: iso(TODAY), duration: '3M', shift: 'morning',
    transactionId: 'T2508131147', paymentMode: 'upi', status: 'pending',
  },
  {
    seat: vacantSeats[1], userName: 'Yuvraj Shaktawat', userPhone: '9928374615',
    message: '', joinDate: iso(shift(2)), duration: '6M', shift: 'full',
    transactionId: '', paymentMode: 'cash', status: 'pending',
  },
  {
    seat: vacantSeats[2], userName: 'Ekta Somani', userPhone: '9660123478',
    message: 'Can I switch to evening later?', joinDate: iso(shift(1)),
    duration: '1M', shift: 'evening', transactionId: 'T2508129903',
    paymentMode: 'upi', status: 'approved',
  },
  {
    seat: [...occupied][3], userName: 'Farhan Sheikh', userPhone: '9829911204',
    message: 'Any seat is fine, please add me to the list.',
    joinDate: iso(TODAY), duration: '3M', shift: 'full',
    transactionId: 'T2508131802', paymentMode: 'upi', status: 'waitlisted',
  },
]);

await AuditLog.insertMany([
  { user: 'Rohit', action: 'Approved Request', details: 'Seat 34 allotted to Ekta Somani (1M)', seat: 34 },
  { user: 'Rohit', action: 'Marked Paid', details: 'Seat 12: fee', seat: 12 },
  { user: 'Rohit', action: 'Renewed Member', details: 'Seat 7 renewed for 3M', seat: 7 },
  { user: 'Rohit', action: 'Vacated Seat', details: 'Seat 61 was vacated.', seat: 61 },
  { user: 'Rohit', action: 'Signed In', details: 'Rohit (owner) signed in' },
]);

console.log(
  `Demo data seeded into "${dbName}":\n` +
  `  ${occupied.size} occupied, ${95 - occupied.size} vacant\n` +
  `  ${payments.length} payments, ${attendance.length} days of attendance\n` +
  `  4 seat requests, 5 audit rows`
);
await mongoose.disconnect();
