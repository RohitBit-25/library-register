// ─── Member Record ──────────────────────────────────────────────
export type Shift = 'morning' | 'evening' | 'full';
export type Duration = '1M' | '3M' | '6M' | '1Y' | '';
export type FeeStatus = 'paid' | 'due' | '';

export interface Member {
  seat: number;        // 1–95, primary key
  name: string;        // full name
  phone: string;       // mobile number
  joinDate: string;    // YYYY-MM-DD
  duration: Duration;
  expiry: string;      // YYYY-MM-DD, auto-calculated
  fee: FeeStatus;
  shift: Shift;        // morning / evening / full
  vacant: boolean;
  paymentMode?: 'upi' | 'cash';
  documentStatus?: string;
  termsAccepted?: boolean;
}

// ─── Derived Status (computed at runtime, never stored) ─────────
export type SeatStatus = 'active' | 'expiring' | 'expired' | 'due' | 'vacant';

// ─── Attendance ─────────────────────────────────────────────────
export interface AttendanceEntry {
  date: string;        // YYYY-MM-DD
  seats: number[];     // list of seat numbers present that day
}

// ─── Stats ──────────────────────────────────────────────────────
export interface Stats {
  occupied: number;
  vacant: number;
  due: number;
  expiring: number;
  expired: number;
  byDuration: Record<string, number>;
  expiringThisWeek: Member[];
  dueMembers: Member[];
  expiredMembers: Member[];
}

// ─── Seat Request ──────────────────────────────────────────────
export interface SeatRequest {
  id: string | number;
  seat: number;
  userName: string;
  userPhone: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string | Date;
}

export type ToastType = 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}
