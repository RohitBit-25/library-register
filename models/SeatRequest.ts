import mongoose, { Schema, Document } from 'mongoose';

export interface ISeatRequest extends Document {
  seat: number;
  userName: string;
  userPhone: string;
  message: string;
  joinDate: string;
  duration: '1M' | '3M' | '6M' | '1Y';
  shift: 'morning' | 'evening' | 'full';
  transactionId: string;
  paymentMode: 'upi' | 'cash';
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  /** Set when the retention job clears documentUrl — proves it was purged,
   *  not that one was never uploaded. */
  documentPurgedAt: Date | null;
  createdAt: Date;
}

const SeatRequestSchema = new Schema<ISeatRequest>({
  seat: { type: Number, required: true },
  userName: { type: String, required: true },
  userPhone: { type: String, required: true },
  message: { type: String, default: '' },
  joinDate: { type: String, default: '' },
  duration: { type: String, enum: ['1M', '3M', '6M', '1Y'], default: '3M' },
  shift: { type: String, enum: ['morning', 'evening', 'full'], default: 'full' },
  transactionId: { type: String, default: '' },
  paymentMode: { type: String, enum: ['upi', 'cash'], default: 'upi' },
  documentUrl: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  documentPurgedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Indexes for filtering
SeatRequestSchema.index({ status: 1 });
SeatRequestSchema.index({ userPhone: 1, status: 1 });
// The retention job scans by status + age.
SeatRequestSchema.index({ status: 1, updatedAt: 1 });

export default mongoose.models.SeatRequest || mongoose.model<ISeatRequest>('SeatRequest', SeatRequestSchema);
