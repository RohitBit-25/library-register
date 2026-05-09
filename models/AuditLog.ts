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

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
