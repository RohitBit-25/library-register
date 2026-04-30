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
    
    const paymentMode = data.paymentMode === 'cash' ? 'cash' : 'upi';

    // Minimal validation
    if (!data.seat || !data.userName || !data.userPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // UPI requires a transaction ID
    if (paymentMode === 'upi' && !data.transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required for UPI payments' }, { status: 400 });
    }

    // Duplicate prevention: check if a pending request already exists for this seat + phone
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
      seat: data.seat,
      userName: data.userName,
      userPhone: data.userPhone,
      message: data.message || '',
      transactionId: data.transactionId || '',
      paymentMode,
      documentUrl: data.documentUrl || '',
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

/**
 * DELETE: Delete a request permanently.
 * Admin only.
 */
export async function DELETE(request: Request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

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
