import mongoose, { Schema, Document } from 'mongoose';
// `import type` (not `{ type X }`) so Node's type-stripping erases the whole
// statement — this lets scripts/seed.ts import the model without a bundler.
import type { Member as MemberType } from '../lib/types.ts';

export interface IMember extends Document, Omit<MemberType, 'seat'> {
  seat: number;
}

// Enums mirror the unions in lib/types.ts. Without them the schema accepted
// `fee: 'banana'` — the type system enforced the shape but the database didn't.
const MemberSchema = new Schema<IMember>({
  seat: { type: Number, required: true, unique: true, min: 1, max: 95 },
  name: { type: String, default: '', trim: true, maxlength: 80 },
  phone: { type: String, default: '', trim: true },
  joinDate: { type: String, default: '' },
  duration: { type: String, enum: ['1M', '3M', '6M', '1Y', ''], default: '' },
  expiry: { type: String, default: '' },
  fee: { type: String, enum: ['paid', 'due', ''], default: '' },
  shift: { type: String, enum: ['morning', 'evening', 'full'], default: 'morning' },
  vacant: { type: Boolean, default: true },
  paymentMode: { type: String, enum: ['upi', 'cash', null], default: null },
  documentStatus: { type: String, default: null },
  termsAccepted: { type: Boolean, default: null }
}, {
  timestamps: true
});

// The daily reminder cron filters on exactly these two fields.
MemberSchema.index({ vacant: 1, expiry: 1 });

export default mongoose.models.Member || mongoose.model<IMember>('Member', MemberSchema);
