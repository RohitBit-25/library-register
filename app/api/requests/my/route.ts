import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SeatRequest from '@/models/SeatRequest';
import { consumeRateLimit, callerKey } from '@/lib/rate-limit';
import { apiError } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * GET /api/requests/my?phone=XXXXXXXXXX
 *
 * Public — a visitor checks the status of a request they submitted. Because it
 * is unauthenticated and phone numbers are enumerable, it returns ONLY status
 * fields. It must never expose `documentUrl` (the uploaded ID image),
 * `transactionId`, `userName`, or `message`: that turned a guessable 10-digit
 * number into a bulk PII and identity-document lookup.
 */
const PUBLIC_FIELDS = 'seat status createdAt joinDate duration shift paymentMode';

/** Lookups per caller per hour. A student checks their own status a handful
 *  of times; a script walking the 10-digit phone space needs thousands. */
const LOOKUP_LIMIT = 30;
const LOOKUP_WINDOW_SECONDS = 3600;

export async function GET(request: NextRequest) {
  // The response is already stripped to status fields, but the endpoint still
  // answers "does this phone number exist in the library" for any number
  // supplied. Unlimited, that is a membership-enumeration oracle.
  const limit = await consumeRateLimit(
    'requests-my', callerKey(request), LOOKUP_LIMIT, LOOKUP_WINDOW_SECONDS
  );
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many lookups. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  const phone = (request.nextUrl.searchParams.get('phone') || '').replace(/\D/g, '');

  if (!/^\d{10}$/.test(phone)) {
    return NextResponse.json(
      { error: 'A valid 10-digit phone number is required' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    const requests = await SeatRequest
      .find({ userPhone: phone })
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json(
      requests.map((r) => ({ ...r, id: String(r._id) })),
      // Never let a shared/proxy cache hold one visitor's request list.
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return apiError('GET /api/requests/my', 'Failed to fetch your requests', error);
  }
}
