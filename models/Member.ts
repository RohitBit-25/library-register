import mongoose, { Schema, Document } from 'mongoose';
import { type Member as MemberType } from '@/lib/types';

export interface IMember extends Document, Omit<MemberType, 'seat'> {
  seat: number;
}

const MemberSchema = new Schema<IMember>({
  seat: { type: Number, required: true, unique: true },
  name: { type: String, default: '' },
  phone: { type: String, default: '' },
  joinDate: { type: String, default: '' },
  duration: { type: String, default: '' },
  expiry: { type: String, default: '' },
  fee: { type: String, default: '' },
  shift: { type: String, default: 'morning' },
  vacant: { type: Boolean, default: true },
  paymentMode: { type: String },
  documentStatus: { type: String },
  termsAccepted: { type: Boolean }
}, {
  timestamps: true
});

export default mongoose.models.Member || mongoose.model<IMember>('Member', MemberSchema);
