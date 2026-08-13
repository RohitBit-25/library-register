import mongoose, { Schema, Document } from 'mongoose';

/**
 * Sessions that have been signed out of, until their token would have expired
 * anyway.
 *
 * Logging out only deleted the cookie in the browser. The JWT itself stayed
 * valid for its full 7 days, so anything holding a copy — a shared library
 * desktop where the cookie was already captured, a browser restored from
 * history — was still signed in as the admin. "Sign out" has to mean the
 * server stops accepting that token, not that one client forgot it.
 *
 * A denylist rather than server-side sessions: the common path (a valid
 * token) stays a signature check with one indexed lookup, and the list only
 * ever holds tokens from the last 7 days.
 */
export interface IRevokedSession extends Document {
  /** The token's `jti` claim. */
  jti: string;
  /** When the token would have expired on its own. TTL index removes it then. */
  expiresAt: Date;
}

const RevokedSessionSchema = new Schema<IRevokedSession>({
  jti: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

// Mongo drops each row once the token it names is dead anyway, so the
// collection cannot grow without bound.
RevokedSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.RevokedSession
  || mongoose.model<IRevokedSession>('RevokedSession', RevokedSessionSchema);
