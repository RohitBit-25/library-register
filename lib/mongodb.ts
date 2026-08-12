import mongoose from 'mongoose';

// No localhost fallback. A missing MONGODB_URI used to silently "succeed" here
// and then fail at query time with an opaque error; now it fails loudly.
const MONGODB_URI = process.env.MONGODB_URI;

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

const cached = global.mongooseCache ??= { conn: null, promise: null };

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env and fill it in.');
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      // Each serverless instance opens its own pool; uncapped, enough cold
      // starts will exhaust the Atlas connection limit.
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // Clear the rejected promise so the next request retries instead of
    // re-awaiting a permanently failed connection.
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
