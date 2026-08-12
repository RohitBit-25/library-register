import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Member from '@/models/Member';
import AuditLog from '@/models/AuditLog';
import { verifyAdmin } from '@/lib/auth-server';
import { memberPatchSchema, seatNumber, formatZodError } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

const VACANT_RESET = {
  name: '', phone: '', joinDate: '', duration: '',
  expiry: '', fee: '', shift: 'morning', vacant: true,
  paymentMode: null, documentStatus: null, termsAccepted: null,
};

export async function PATCH(request: Request, { params }: { params: Promise<{ seat: string }> }) {
  try {
    if (!await verifyAdmin()) {
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

    // No upsert: the 95 seats are seeded once. Upserting on an unvalidated
    // path param used to let PATCH /api/members/9999 invent a phantom seat.
    const updatedMember = await Member.findOneAndUpdate(
      filter,
      { $set: patch },
      { new: true }
    ).lean();

    if (!updatedMember) {
      if (patch.vacant === false) {
        return NextResponse.json({ error: 'Seat is already occupied' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Seat not found' }, { status: 404 });
    }

    let actionDesc = 'Updated Member';
    if (patch.vacant === true) actionDesc = 'Vacated Seat';
    else if (patch.vacant === false) actionDesc = 'Allotted Seat';
    else if (patch.expiry) actionDesc = 'Membership Renewed';
    else if (patch.fee) actionDesc = `Fee marked as ${patch.fee}`;

    await AuditLog.create({
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
    if (!await verifyAdmin()) {
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
      action: 'Vacated Seat',
      details: `Seat ${seatId} was vacated.`,
      seat: seatId,
    });

    return NextResponse.json(vacatedMember);
  } catch (error) {
    console.error('Error vacating member:', error);
    return NextResponse.json({ error: 'Failed to vacate member' }, { status: 500 });
  }
}
