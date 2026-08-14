import { NextResponse } from 'next/server';
import { apiError } from '@/lib/log';
import dbConnect from '@/lib/mongodb';
import SeatRequest from '@/models/SeatRequest';
import AuditLog from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

/**
 * Days a decided request keeps its uploaded ID document.
 *
 * Long enough to handle a dispute about an approval, short enough that the
 * library is not indefinitely holding government IDs it no longer needs.
 */
export const RETENTION_DAYS = 30;

/**
 * GET /api/cron/purge-documents — delete ID documents from settled requests.
 *
 * Uploaded IDs are stored as base64 inside the request document (see the audit
 * report: moving them to object storage needs a bucket, and is still open).
 * Until that lands, the exposure is unbounded in time: a scan of an Aadhaar
 * card submitted last year is still sitting in the primary collection.
 *
 * This does not fix the storage location. It bounds how long the data exists,
 * which is the half that needs no infrastructure — and it is the half that
 * matters most, because most of the risk is in the tail of old records nobody
 * will ever look at again.
 *
 * Only `documentUrl` is cleared. The request itself stays, so the approval
 * history remains intact and auditable.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return apiError('GET /api/cron/purge-documents', 'Not configured', 'CRON_SECRET is not set — refusing to run the purge job.', 503);
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    // Pending requests are excluded: the admin has not yet seen the document,
    // so purging it would destroy the evidence the decision depends on.
    // `$nin` on the empty string makes this idempotent — a second run in the
    // same window matches nothing.
    const filter = {
      status: { $in: ['approved', 'rejected'] },
      updatedAt: { $lt: cutoff },
      documentUrl: { $nin: ['', null] },
    };

    const due = await SeatRequest.countDocuments(filter);
    if (due === 0) {
      return NextResponse.json({
        success: true,
        purged: 0,
        message: `No settled requests older than ${RETENTION_DAYS} days hold a document.`,
      });
    }

    const result = await SeatRequest.updateMany(filter, {
      $set: { documentUrl: '', documentPurgedAt: new Date() },
    });

    await AuditLog.create({
      user: 'System',
      action: 'Purged ID Documents',
      details:
        `Cleared ${result.modifiedCount} ID document(s) from requests settled `
        + `more than ${RETENTION_DAYS} days ago. Request records kept.`,
    });

    return NextResponse.json({
      success: true,
      purged: result.modifiedCount,
      retentionDays: RETENTION_DAYS,
    });
  } catch (error) {
    return apiError('GET /api/cron/purge-documents', 'Internal Server Error', error);
  }
}
