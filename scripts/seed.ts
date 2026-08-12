/**
 * One-time seed: create the 95 vacant seat documents.
 *
 * Run with: npm run seed
 *
 * This used to live inside GET /api/members, which meant a read endpoint ran
 * insertMany — non-idempotent, and two concurrent cold-start requests both saw
 * an empty collection, both inserted, and the second threw on the unique index.
 */
import mongoose from 'mongoose';
import Member from '../models/Member.ts';
import { getDefaultMembers } from '../lib/defaultData.ts';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set. Copy .env.example to .env first.');
  process.exit(1);
}

const force = process.argv.includes('--force');

await mongoose.connect(uri);

const existing = await Member.countDocuments();
if (existing > 0 && !force) {
  console.log(
    `${existing} seat document(s) already exist — nothing to do.\n` +
    'Pass --force to DELETE all members and reseed (destructive).'
  );
  await mongoose.disconnect();
  process.exit(0);
}

if (force && existing > 0) {
  console.log(`--force: deleting ${existing} existing member document(s)...`);
  await Member.deleteMany({});
}

const seeds = getDefaultMembers();
await Member.insertMany(seeds);
console.log(`Seeded ${seeds.length} vacant seats.`);

await mongoose.disconnect();
