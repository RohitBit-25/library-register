import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError } from '@/lib/log';
import dbConnect from '@/lib/mongodb';
import Member from '@/models/Member';
import Attendance from '@/models/Attendance';
import AuditLog from '@/models/AuditLog';
import { getSession } from '@/lib/auth-server';
import { seatNumber, formatZodError } from '@/lib/schemas';
import { todayLocalISO } from '@/lib/seat-status';

export const dynamic = 'force-dynamic';

const moveSchema = z.object({ from: seatNumber, to: seatNumber })
  .refine((d) => d.from !== d.to, { message: 'Pick a different desk', path: ['to'] });

/** Everything that belongs to the member, not the desk. */
const MEMBER_FIELDS = [
  'name', 'phone', 'joinDate', 'duration', 'expiry', 'fee', 'shift',
  'paymentMode', 'documentStatus', 'termsAccepted',
  'lastPaymentAt', 'lastPaymentAmount', 'reminderSentFor', 'reminderSentAt',
] as const;

const VACANT_RESET = {
  name: '', phone: '', joinDate: '', duration: '',
  expiry: '', fee: '', shift: 'morning', vacant: true,
  paymentMode: null, documentStatus: null, termsAccepted: null,
  lastPaymentAt: null, lastPaymentAmount: 0, reminderSentFor: '', reminderSentAt: null,
};

/**
 * POST /api/members/move — move a member to another desk. Staff only.
 *
 * Libraries shift people constantly; this used to mean vacating the seat and
 * re-adding the member by hand, which re-recorded their fee as a new payment.
 * Order: claim the new desk only if it is still free, then free the old one,
 * so two staff moving people at once can never put two members on one desk.
 * Payments keep the seat they were made at — that is history, not state.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const parsed = moveSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { from, to } = parsed.data;
    await dbConnect();

    const source = await Member.findOne({ seat: from, vacant: false }).lean<Record<string, unknown> | null>();
    if (!source) return NextResponse.json({ error: `Seat ${from} has no member to move` }, { status: 404 });

    const fields: Record<string, unknown> = { vacant: false };
    for (const k of MEMBER_FIELDS) if (k in source) fields[k] = source[k];

    const claimed = await Member.findOneAndUpdate(
      { seat: to, vacant: true },
      { $set: fields },
      { new: true },
    ).lean();
    if (!claimed) {
      return NextResponse.json({ error: `Seat ${to} is no longer free` }, { status: 409 });
    }

    // Free the old desk — only if it still holds the same person.
    await Member.updateOne({ seat: from, vacant: false, name: source.name }, { $set: VACANT_RESET });

    // Today's check-in follows them.
    const today = todayLocalISO();
    const att = await Attendance.findOne({ date: today, seats: from }).select('_id').lean();
    if (att) {
      await Attendance.updateOne({ date: today }, { $pull: { seats: from } });
      await Attendance.updateOne({ date: today }, { $addToSet: { seats: to } });
    }

    await AuditLog.create({
      user: session.name,
      action: 'Moved Member',
      details: `${source.name}: seat ${from} → seat ${to}`,
      seat: to,
    });

    return NextResponse.json({ from, to, member: claimed });
  } catch (error) {
    return apiError('POST /api/members/move', 'Failed to move member', error);
  }
}
