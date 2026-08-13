import mongoose, { Schema, Document } from 'mongoose';

/**
 * A named staff member with their own PIN.
 *
 * The app had one shared PIN and one identity, "Admin". Every audit row said
 * "Admin", so the log could record *what* happened but never *who* did it —
 * which is most of the point of an audit log. It also meant a departing
 * employee's access could only be revoked by changing everyone's PIN.
 *
 * Replaces the single-document AdminCredential collection; the existing
 * credential is migrated into the first owner on boot (see lib/pin-store).
 */

/** `owner` can manage staff and delete data; `staff` runs the day to day. */
export type StaffRole = 'owner' | 'staff';

export interface IStaff extends Document {
  name: string;
  pinHash: string;
  role: StaffRole;
  active: boolean;
  failedAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>({
  name: { type: String, required: true, trim: true, maxlength: 40 },
  pinHash: { type: String, required: true },
  role: { type: String, enum: ['owner', 'staff'], default: 'staff' },
  // Deactivating rather than deleting keeps their name resolvable on the
  // audit rows they already created.
  active: { type: Boolean, default: true },
  failedAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
}, {
  timestamps: true,
});

StaffSchema.index({ active: 1 });

export default mongoose.models.Staff || mongoose.model<IStaff>('Staff', StaffSchema);
