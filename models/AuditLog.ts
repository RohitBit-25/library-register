import mongoose from 'mongoose';

export interface IAuditLog extends mongoose.Document {
  action: string;
  details: string;
  seat?: number;
  user?: string;
  timestamp: Date;
}

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  details: { type: String, required: true },
  seat: { type: Number },
  user: { type: String, default: 'Admin' },
  timestamp: { type: Date, default: Date.now }
});

// /api/audit sorts by timestamp; without this it was an unindexed sort.
AuditLogSchema.index({ timestamp: -1 });

// The log grew forever while only the newest 100 rows were ever read. Mongo
// drops documents past this age automatically.
const RETENTION_DAYS = 180;
AuditLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60 }
);

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
