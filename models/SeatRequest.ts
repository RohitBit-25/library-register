import mongoose, { Schema, Document } from 'mongoose';

export interface ISeatRequest extends Document {
  seat: number;
  userName: string;
  userPhone: string;
  message: string;
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

const SeatRequestSchema = new Schema<ISeatRequest>({
  seat: { type: Number, required: true },
  userName: { type: String, required: true },
  userPhone: { type: String, required: true },
  message: { type: String, default: '' },
  transactionId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, {
  timestamps: true
});

// Indexes for filtering
SeatRequestSchema.index({ status: 1 });
SeatRequestSchema.index({ userPhone: 1, status: 1 });

export default mongoose.models.SeatRequest || mongoose.model<ISeatRequest>('SeatRequest', SeatRequestSchema);
