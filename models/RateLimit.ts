import mongoose, { Schema, Document } from 'mongoose';

/**
 * A fixed-window request counter, keyed by caller and route.
 *
 * Lives in MongoDB rather than memory because the app runs serverless: an
 * in-process counter resets on every cold start and is not shared between
 * instances, so it would cap nothing under exactly the load that matters.
 *
 * Rows expire themselves via a TTL index — there is no cleanup job to forget.
 */
export interface IRateLimit extends Document {
  /** `${route}:${identifier}` — e.g. `requests:203.0.113.4`. */
  key: string;
  count: number;
  /** Start of the current window; the TTL is measured from here. */
  windowStart: Date;
}

const RateLimitSchema = new Schema<IRateLimit>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  windowStart: { type: Date, default: Date.now },
});

// Mongo's TTL monitor runs about once a minute, so a row can outlive its
// window briefly. That only ever makes the limiter slightly stricter, never
// looser, which is the safe direction to be wrong in.
RateLimitSchema.index({ windowStart: 1 }, { expireAfterSeconds: 3600 });

export default mongoose.models.RateLimit
  || mongoose.model<IRateLimit>('RateLimit', RateLimitSchema);
