import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SeatRequest from '@/models/SeatRequest';

export const dynamic = 'force-dynamic';

type RequestRecord = {
  _id?: { toString(): string };
  [key: string]: unknown;
};

function serializeRequest(request: RequestRecord) {
  return {
    ...request,
    id: request._id?.toString() || request.id,
  };
}

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
    const requests = await SeatRequest.find({ userPhone: phone }).sort({ createdAt: -1 }).lean<RequestRecord[]>();
    return NextResponse.json(requests.map(serializeRequest));
  } catch (error) {
    console.error('My requests GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch your requests' },
      { status: 500 }
    );
  }
}
