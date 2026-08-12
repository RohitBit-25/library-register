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

// No explicit { date: 1 } index here — `unique: true` above already creates
// one, and declaring both made Mongoose build a duplicate.

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
