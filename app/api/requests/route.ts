import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SeatRequest from '@/models/SeatRequest';
import { verifyAdmin } from '@/lib/auth-server';

/**
 * GET: List all seat requests.
 * Admin only.
 */
export async function GET() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const requests = await SeatRequest.find({}).sort({ createdAt: -1 });
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Request GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

/**
 * POST: Submit a new request.
 * Public for visitors.
 */
export async function POST(request: Request) {
  try {
    await dbConnect();
    const data = await request.json();
    
    // Minimal validation
    if (!data.seat || !data.userName || !data.userPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newRequest = await SeatRequest.create({
      seat: data.seat,
      userName: data.userName,
      userPhone: data.userPhone,
      message: data.message || '',
      status: 'pending'
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Request POST error:', error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}

/**
 * PATCH: Update request status (e.g., Approve/Reject).
 * Admin only.
 */
export async function PATCH(request: Request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { id, status } = await request.json();

    if (!id || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const updated = await SeatRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Request PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}
