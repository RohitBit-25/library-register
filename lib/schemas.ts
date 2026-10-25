import { z } from 'zod';
import { isSeat, SEAT_COUNT } from './layoutConfig.ts';

// ─── Shared API validation ──────────────────────────────────────
// Every route body is parsed through one of these. Previously routes used
// ad-hoc `if (!data.seat)` checks, which let unbounded seat numbers, oversized
// base64 uploads, and arbitrary $set payloads through.

/** Seats in the hall: 95, numbered 1–95 (lib/layoutConfig). */
export const TOTAL_SEATS = SEAT_COUNT;

/** Max characters for a base64 data URI. 2MB binary ≈ 2.8MB base64. */
const MAX_DOCUMENT_CHARS = 2_900_000;

export const seatNumber = z.coerce
  .number()
  .int('Seat must be a whole number')
  .min(1, 'Seat must be at least 1')
  .max(95, 'Seat must be at most 95')
  // The plan is the authority, not the range: if a number ever leaves the
  // plan, every route that takes a seat rejects it.
  .refine(isSeat, 'There is no seat with that number');

/** For forms: any spacing allowed, exactly 10 digits required — the same
 *  rule the API applies, so a typo is caught before the request is sent. */
export const phoneInput = z
  .string()
  .refine((s) => s.replace(/\D/g, '').length === 10, 'Enter a 10-digit mobile number');

export const phone = z
  .string()
  .transform((s) => s.replace(/\D/g, ''))
  .pipe(z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'));

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const duration = z.enum(['1M', '3M', '6M', '1Y']);
export const shift = z.enum(['morning', 'evening', 'full']);
export const feeStatus = z.enum(['paid', 'due']);
export const paymentMode = z.enum(['upi', 'cash']);
export const requestStatus = z.enum(['pending', 'approved', 'rejected', 'waitlisted']);

/** Accepts an inline image/PDF data URI, size-capped. Empty string = none. */
export const documentDataUri = z
  .string()
  .max(MAX_DOCUMENT_CHARS, 'Document must be under 2MB')
  .refine(
    (s) => s === '' || /^data:(image\/(jpeg|png|webp)|application\/pdf);base64,/.test(s),
    'Document must be a JPEG, PNG, WebP, or PDF'
  );

// ─── Route bodies ───────────────────────────────────────────────

/** PATCH /api/members/[seat] — explicit allow-list, so a client cannot $set
 *  arbitrary schema fields and bypass the rules the UI enforces. */
export const memberPatchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  phone: phone.optional(),
  joinDate: isoDate.optional(),
  duration: duration.or(z.literal('')).optional(),
  expiry: isoDate.or(z.literal('')).optional(),
  fee: feeStatus.or(z.literal('')).optional(),
  shift: shift.optional(),
  vacant: z.boolean().optional(),
  paymentMode: paymentMode.optional(),
  documentStatus: z.string().max(200).optional(),
  termsAccepted: z.boolean().optional(),
  /** Set by the Renew action: a new term was paid for, even if the last one
   *  was paid too. Not stored — it only decides whether to write a Payment. */
  renewal: z.boolean().optional(),
}).strict();

/** POST /api/requests — public endpoint, so this is a trust boundary. */
export const seatRequestCreateSchema = z.object({
  seat: seatNumber,
  userName: z.string().trim().min(1, 'Name is required').max(80),
  userPhone: phone,
  message: z.string().trim().max(500).default(''),
  joinDate: isoDate.optional(),
  duration: duration.default('3M'),
  shift: shift.default('full'),
  transactionId: z.string().trim().max(64).default(''),
  paymentMode: paymentMode.default('upi'),
  documentUrl: documentDataUri.default(''),
}).refine(
  (d) => d.paymentMode !== 'upi' || d.transactionId.length > 0,
  { message: 'Transaction ID is required for UPI payments', path: ['transactionId'] }
);

/** PATCH /api/requests */
export const seatRequestUpdateSchema = z.object({
  id: z.string().min(1),
  status: requestStatus,
});

/** POST /api/attendance — either a single toggle or a bulk set. */
export const attendanceSchema = z.union([
  z.object({
    allPresent: z.literal(true),
    date: isoDate,
    seats: z.array(seatNumber).max(TOTAL_SEATS),
  }),
  z.object({
    allPresent: z.literal(false).optional(),
    date: isoDate,
    seat: seatNumber,
    present: z.boolean(),
  }),
]);

// ─── Helper ─────────────────────────────────────────────────────

/** Flatten a ZodError into a single readable sentence for the API response. */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message))
    .join('; ');
}
