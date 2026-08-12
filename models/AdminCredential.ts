import mongoose, { Schema, Document } from 'mongoose';

/**
 * Single-document collection holding the admin PIN hash and brute-force state.
 *
 * Replaces the old `.admin-pin.json` file, which stored the PIN in plaintext,
 * lived on an ephemeral (and on Vercel, read-only) filesystem, and reset on
 * every deploy. Keeping it in Mongo also makes the failed-attempt counter
 * shared across serverless instances — an in-memory counter would reset on
 * every cold start and give an attacker unlimited tries.
 */
export interface IAdminCredential extends Document {
  key: 'admin';
  pinHash: string;
  failedAttempts: number;
  lockedUntil: Date | null;
  updatedAt: Date;
}

const AdminCredentialSchema = new Schema<IAdminCredential>({
  key: { type: String, required: true, unique: true, default: 'admin' },
  pinHash: { type: String, required: true },
  failedAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
}, {
  timestamps: true,
});

export default mongoose.models.AdminCredential
  || mongoose.model<IAdminCredential>('AdminCredential', AdminCredentialSchema);
