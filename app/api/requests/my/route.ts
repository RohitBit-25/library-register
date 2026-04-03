import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SeatRequest from '@/models/SeatRequest';

/**
 * GET /api/requests/my?phone=XXXXXXXXXX
 * Public endpoint — lets users look up their own requests by phone number.
 */
export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone');

  if (!phone || phone.length < 10) {
    return NextResponse.json(
      { error: 'A valid phone number is required' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    const requests = await SeatRequest.find({ userPhone: phone }).sort({ createdAt: -1 });
    return NextResponse.json(requests);
  } catch (error) {
    console.error('My requests GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch your requests' },
      { status: 500 }
    );
  }
}
