import mongoose from 'mongoose';
import Staff from '../models/Staff.ts';
await mongoose.connect(process.env.MONGODB_URI);
const r = await Staff.updateMany({}, { $set: { failedAttempts: 0, lockedUntil: null } });
console.log('unlocked staff:', r.modifiedCount);
await mongoose.disconnect();
