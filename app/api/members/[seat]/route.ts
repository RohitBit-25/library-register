import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Member from '@/models/Member';
import AuditLog from '@/models/AuditLog';
import { getSession } from '@/lib/auth-server';
import { memberPatchSchema, seatNumber, formatZodError } from '@/lib/schemas';
import Payment from '@/models/Payment';
import SeatRequest from '@/models/SeatRequest';
import { planPrice } from '@/lib/pricing';
import { todayLocalISO } from '@/lib/seat-status';

export const dynamic = 'force-dynamic';

const VACANT_RESET = {
  name: '', phone: '', joinDate: '', duration: '',
  expiry: '', fee: '', shift: 'morning', vacant: true,
  paymentMode: null, documentStatus: null, termsAccepted: null,
};

export async function PATCH(request: Request, { params }: { params: Promise<{ seat: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsedSeat = seatNumber.safeParse((await params).seat);
    if (!parsedSeat.success) {
      return NextResponse.json({ error: 'Invalid seat number' }, { status: 400 });
    }
    const seatId = parsedSeat.data;

    const parsedBody = memberPatchSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: formatZodError(parsedBody.error) },
        { status: 400 }
      );
    }
    const patch = parsedBody.data;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await dbConnect();

    // Allotting a seat: the vacancy check has to be part of the write filter.
    // A separate findOne-then-update let two admins both pass the check and the
    // second silently overwrite the first member's record.
    const filter = patch.vacant === false
      ? { seat: seatId, vacant: true }
      : { seat: seatId };

    // Record the collection when the fee flips to paid, so revenue comes from
    // real events rather than being inferred from current state.
    const writes: Record<string, unknown> = { ...patch };
    let paymentToRecord: {
      amount: number; duration: string;
      name: string; phone: string; mode: 'upi' | 'cash' | null;
    } | null = null;

    if (patch.fee === 'paid') {
      const current = await Member.findOne({ seat: seatId })
        .select('duration fee name phone paymentMode')
        .lean<{
          duration?: string; fee?: string; name?: string;
          phone?: string; paymentMode?: 'upi' | 'cash' | null;
        } | null>();

      // Only an actual transition counts. Re-saving an already-paid member
      // must not look like a second payment.
      if (current?.fee !== 'paid') {
        const duration = patch.duration ?? current?.duration ?? '';
        paymentToRecord = {
          amount: planPrice(duration),
          duration,
          name: patch.name ?? current?.name ?? '',
          phone: patch.phone ?? current?.phone ?? '',
          mode: patch.paymentMode ?? current?.paymentMode ?? null,
        };
        writes.lastPaymentAt = new Date();
        writes.lastPaymentAmount = paymentToRecord.amount;
      }
    }

    // No upsert: the 95 seats are seeded once. Upserting on an unvalidated
    // path param used to let PATCH /api/members/9999 invent a phantom seat.
    const updatedMember = await Member.findOneAndUpdate(
      filter,
      { $set: writes },
      { new: true }
    ).lean();

    if (!updatedMember) {
      if (patch.vacant === false) {
        return NextResponse.json({ error: 'Seat is already occupied' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Seat not found' }, { status: 404 });
    }

    // Append-only ledger row. Written after the member update succeeds, so a
    // failed write never leaves a payment recorded against nothing.
    if (paymentToRecord && paymentToRecord.amount > 0) {
      await Payment.create({
        seat: seatId,
        memberName: paymentToRecord.name,
        memberPhone: paymentToRecord.phone,
        amount: paymentToRecord.amount,
        duration: paymentToRecord.duration,
        paymentMode: paymentToRecord.mode,
        date: todayLocalISO(),
      });
    }

    let actionDesc = 'Updated Member';
    if (patch.vacant === true) actionDesc = 'Vacated Seat';
    else if (patch.vacant === false) actionDesc = 'Allotted Seat';
    else if (patch.expiry) actionDesc = 'Membership Renewed';
    else if (patch.fee) actionDesc = `Fee marked as ${patch.fee}`;

    await AuditLog.create({
      user: session.name,
      action: actionDesc,
      details: `Seat ${seatId}: ${Object.keys(patch).join(', ')}`,
      seat: seatId,
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating member at seat:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ seat: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsedSeat = seatNumber.safeParse((await params).seat);
    if (!parsedSeat.success) {
      return NextResponse.json({ error: 'Invalid seat number' }, { status: 400 });
    }
    const seatId = parsedSeat.data;

    await dbConnect();

    const vacatedMember = await Member.findOneAndUpdate(
      { seat: seatId },
      { $set: VACANT_RESET },
      { new: true }
    ).lean();

    if (!vacatedMember) {
      return NextResponse.json({ error: 'Seat not found' }, { status: 404 });
    }

    // The DELETE path used to skip the audit log entirely, so vacating a seat
    // left no trace.
    await AuditLog.create({
      user: session.name,
      action: 'Vacated Seat',
      details: `Seat ${seatId} was vacated.`,
      seat: seatId,
    });

    // A freed seat is the only moment the waitlist becomes actionable, so the
    // response carries it. Otherwise the queue is a table nobody thinks to
    // open, and people stay queued while a seat sits empty.
    const waitlist = await SeatRequest.find({ status: 'waitlisted' })
      .select('seat userName userPhone createdAt')
      .sort({ createdAt: 1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      ...vacatedMember,
      waitlist: waitlist.map((w) => ({ ...w, id: String(w._id) })),
    });
  } catch (error) {
    console.error('Error vacating member:', error);
    return NextResponse.json({ error: 'Failed to vacate member' }, { status: 500 });
  }
}
