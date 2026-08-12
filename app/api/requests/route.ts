import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SeatRequest from '@/models/SeatRequest';
import Member from '@/models/Member';
import { verifyAdmin } from '@/lib/auth-server';
import { todayISO } from '@/lib/utils';
import { seatRequestCreateSchema, seatRequestUpdateSchema, formatZodError } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

/** 2MB binary ≈ 2.8MB base64; allow headroom for the rest of the JSON body. */
const MAX_BODY_BYTES = 3_200_000;

type RequestRecord = { _id?: { toString(): string }; [key: string]: unknown };

function serializeRequest(request: RequestRecord) {
  return { ...request, id: request._id?.toString() || request.id };
}

/**
 * Read the body with a hard size cap. The 2MB limit previously existed only in
 * the browser (SeatRequestSheet), so this public endpoint accepted arbitrarily
 * large base64 blobs — enough to fill the database or blow Mongo's 16MB
 * document ceiling.
 */
async function readJsonCapped(request: Request): Promise<unknown> {
  const declared = request.headers.get('content-length');
  if (declared && Number(declared) > MAX_BODY_BYTES) {
    throw new Error('PAYLOAD_TOO_LARGE');
  }
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    throw new Error('PAYLOAD_TOO_LARGE');
  }
  return JSON.parse(text);
}

/** GET: list all seat requests. Admin only. */
export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const requests = await SeatRequest.find({}).sort({ createdAt: -1 }).lean<RequestRecord[]>();
    return NextResponse.json(requests.map(serializeRequest), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Request GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

/** POST: submit a new request. Public — treat every field as hostile. */
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await readJsonCapped(request);
  } catch (err) {
    if ((err as Error).message === 'PAYLOAD_TOO_LARGE') {
      return NextResponse.json(
        { error: 'Request too large. Documents must be under 2MB.' },
        { status: 413 }
      );
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = seatRequestCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const data = parsed.data;

  try {
    await dbConnect();

    // Don't accept requests for a seat that is already taken — otherwise the
    // admin queue fills with requests that can never be approved.
    const seatDoc = await Member.findOne({ seat: data.seat }).select('vacant').lean<{ vacant: boolean } | null>();
    if (seatDoc && !seatDoc.vacant) {
      return NextResponse.json({ error: 'That seat is no longer available' }, { status: 409 });
    }

    const existing = await SeatRequest.findOne({
      seat: data.seat,
      userPhone: data.userPhone,
      status: 'pending',
    });
    if (existing) {
      return NextResponse.json(
        { error: 'You already have a pending request for this seat' },
        { status: 409 }
      );
    }

    const newRequest = await SeatRequest.create({
      ...data,
      joinDate: data.joinDate || todayISO(),
      status: 'pending',
    });

    return NextResponse.json(serializeRequest(newRequest.toObject()), { status: 201 });
  } catch (error) {
    console.error('Request POST error:', error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}

/** PATCH: approve/reject. Admin only. */
export async function PATCH(request: Request) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parsed = seatRequestUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { id, status } = parsed.data;

    await dbConnect();
    const updated = await SeatRequest.findByIdAndUpdate(id, { status }, { new: true });

    if (!updated) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json(serializeRequest(updated.toObject()));
  } catch (error) {
    console.error('Request PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}

/** DELETE: remove a request permanently. Admin only. */
export async function DELETE(request: Request) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing request ID' }, { status: 400 });
    }

    await dbConnect();
    const deleted = await SeatRequest.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Request DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 });
  }
}
