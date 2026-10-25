import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { apiError } from '@/lib/log';
import dbConnect from '@/lib/mongodb';
import SeatRequest from '@/models/SeatRequest';
import AuditLog from '@/models/AuditLog';
import { getSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/requests/:id/document — one request's uploaded ID. Staff only.
 *
 * The request list used to carry every ID inline (up to ~2.8MB each), so the
 * Requests page downloaded all of them on every load. It now returns a
 * `hasDocument` flag, and the image is fetched here when someone asks to see
 * it — which is also logged, since these are government IDs.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const req = await SeatRequest.findById(id)
      .select('seat userName documentUrl documentPurgedAt')
      .lean<{ seat: number; userName: string; documentUrl?: string; documentPurgedAt?: Date | null } | null>();
    if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (!req.documentUrl) {
      return NextResponse.json(
        { error: req.documentPurgedAt ? 'This ID was deleted after 30 days.' : 'No ID was uploaded.' },
        { status: 404 }
      );
    }

    await AuditLog.create({
      user: session.name,
      action: 'Viewed ID Document',
      details: `Seat ${req.seat} request from ${req.userName}`,
      seat: req.seat,
    });

    return NextResponse.json(
      { documentUrl: req.documentUrl },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return apiError('GET /api/requests/[id]/document', 'Failed to load the document', error);
  }
}
