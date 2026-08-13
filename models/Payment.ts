import mongoose, { Schema, Document } from 'mongoose';

/**
 * An append-only record of every fee collection.
 *
 * The first cut stamped `lastPaymentAt` / `lastPaymentAmount` on the Member
 * itself. That is one slot per member, so a member who paid twice inside the
 * reporting window overwrote their own first payment and the total silently
 * undercounted. Money should not be stored in a field that can be clobbered.
 *
 * Rows are never mutated — a correction is a new row with a negative amount,
 * which keeps the audit trail intact.
 */
export interface IPayment extends Document {
  seat: number;
  memberName: string;
  memberPhone: string;
  amount: number;
  duration: string;
  paymentMode: 'upi' | 'cash' | null;
  /** YYYY-MM-DD, local — so "this month" means the library's month. */
  date: string;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  seat: { type: Number, required: true, min: 1, max: 95 },
  memberName: { type: String, default: '' },
  memberPhone: { type: String, default: '' },
  amount: { type: Number, required: true },
  duration: { type: String, default: '' },
  paymentMode: { type: String, enum: ['upi', 'cash', null], default: null },
  date: { type: String, required: true },
}, {
  timestamps: true,
});

// Reporting is always "payments in a date range", newest first.
PaymentSchema.index({ date: -1 });
// Per-member history, for receipts and disputes.
PaymentSchema.index({ seat: 1, date: -1 });

export default mongoose.models.Payment
  || mongoose.model<IPayment>('Payment', PaymentSchema);
