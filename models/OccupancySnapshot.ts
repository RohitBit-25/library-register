import mongoose, { Schema, Document } from 'mongoose';

/**
 * One row per day describing the state of the library.
 *
 * /api/stats reports what is true *now*. Nothing recorded what was true last
 * month, so "are we growing?" — the question that decides whether to expand —
 * had no answer, and the dashboard once filled that gap with Math.random().
 *
 * Written by a nightly cron. Snapshots are immutable history: re-running the
 * job for a date overwrites that date rather than appending, so a retry can
 * never double-count.
 */
export interface IOccupancySnapshot extends Document {
  /** YYYY-MM-DD, local. Unique — one row per day. */
  date: string;
  occupied: number;
  vacant: number;
  expired: number;
  withDues: number;
  /** Value of all active plans on that day, in rupees. */
  contractValue: number;
  /** Actually collected that day, from the payment ledger. */
  collected: number;
  /** Members present that day, from attendance. Null when never recorded —
   *  distinct from a genuine zero. */
  present: number | null;
}

const OccupancySnapshotSchema = new Schema<IOccupancySnapshot>({
  date: { type: String, required: true, unique: true },
  occupied: { type: Number, default: 0 },
  vacant: { type: Number, default: 0 },
  expired: { type: Number, default: 0 },
  withDues: { type: Number, default: 0 },
  contractValue: { type: Number, default: 0 },
  collected: { type: Number, default: 0 },
  present: { type: Number, default: null },
}, {
  timestamps: true,
});

// `unique: true` on `date` already creates the index the range queries use.

export default mongoose.models.OccupancySnapshot
  || mongoose.model<IOccupancySnapshot>('OccupancySnapshot', OccupancySnapshotSchema);
