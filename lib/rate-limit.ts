import dbConnect from '@/lib/mongodb';
import RateLimit from '@/models/RateLimit';

// ─── Fixed-window rate limiting ─────────────────────────────────
// `POST /api/requests` is the only public write in the app. Its body size was
// capped but its frequency was not, so one script could fill the admin queue
// with thousands of submissions — each carrying up to 2MB of base64.

export interface LimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Best-effort caller identity.
 *
 * Behind a proxy the socket address is the proxy's, so the forwarded headers
 * are the only signal available — and they are client-controlled, meaning this
 * is a speed bump for casual abuse, not an authentication boundary. The first
 * entry in x-forwarded-for is the closest thing to the origin that a platform
 * like Vercel appends for us.
 */
export function callerKey(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * Consume one unit against `route:identifier`.
 *
 * Fixed window rather than sliding: a sliding log needs one row per request,
 * which for an abuse-prevention counter costs more storage than the abuse.
 * The trade is that a burst can straddle a boundary and briefly get 2x the
 * limit — acceptable when the limit exists to stop floods, not to meter usage.
 */
export async function consumeRateLimit(
  route: string,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<LimitResult> {
  await dbConnect();

  const key = `${route}:${identifier}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  // One atomic upsert. Two concurrent requests cannot both read a stale count
  // and each write count+1, which is exactly how a read-then-write limiter
  // lets a burst through.
  const doc = await RateLimit.findOneAndUpdate(
    { key, windowStart: { $gte: windowStart } },
    { $inc: { count: 1 }, $setOnInsert: { key, windowStart: now } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).catch(async (err: unknown) => {
    // Upserting on a stale window races the unique index on `key`: the filter
    // misses the expired row, so the upsert tries to insert a duplicate.
    // That means the window has rolled over — reset it and count this request.
    if ((err as { code?: number }).code === 11000) {
      return RateLimit.findOneAndUpdate(
        { key },
        { $set: { count: 1, windowStart: now } },
        { new: true, upsert: true }
      );
    }
    throw err;
  });

  const count = doc?.count ?? 1;
  const started = doc?.windowStart ?? now;
  const resetAt = started.getTime() + windowSeconds * 1000;

  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now.getTime()) / 1000)),
  };
}
