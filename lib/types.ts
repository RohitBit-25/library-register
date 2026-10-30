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
/** A new member as the Add member form sends it: the member's fields plus
 *  what they paid (for the Payment row; not stored on the member). */
export type NewMember = Omit<Member, 'seat' | 'vacant'> & { amount?: number };

export interface SeatRequest {
  id: string | number;
  seat: number;
  userName: string;
  userPhone: string;
  message: string;
  joinDate?: string;
  duration?: Duration;
  shift?: Shift;
  transactionId?: string;
  paymentMode: 'upi' | 'cash';
  documentUrl?: string;
  /** Rupees the student entered for UPI; 0 or missing = the plan price. */
  amount?: number;
  /** Staff list only: an ID was uploaded (fetch it from /api/requests/:id/document). */
  hasDocument?: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  createdAt: string | Date;
  /** When the status last changed (approval / rejection). */
  updatedAt?: string | Date;
}

export type ToastType = 'success' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  /** One button, e.g. Undo. The toast stays up longer when it has one. */
  action?: ToastAction;
}
