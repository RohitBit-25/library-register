import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  date: string;        // YYYY-MM-DD
  seats: number[];     // list of seat numbers present that day
}

const AttendanceSchema = new Schema<IAttendance>({
  date: { type: String, required: true, unique: true },
  seats: { type: [Number], default: [] }
}, {
  timestamps: true
});

// Index by date for high-performance monthly/weekly attendance lookups
AttendanceSchema.index({ date: 1 });

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
