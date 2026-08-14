import { randomUUID } from 'crypto';

/**
 * Structured logging for the API routes.
 *
 * Before this, every route caught its errors like:
 *
 *     console.error('Attendance GET error:', error);
 *
 * — twenty-five of them. That prints a stack to stdout and nothing else. When
 * someone says "it failed this morning", there is no way to find *which*
 * failure they mean: no identifier the user can quote, no way to tie two log
 * lines to the same failure, and no field to grep on beyond a prose prefix.
 *
 * Three things fix that, and nothing more is needed:
 *
 * 1. **An id on every failure**, carried into the log line, the response
 *    header and the response body, so a bug report can quote it.
 * 2. **JSON lines**, so `route`, `reqId` and `message` are fields rather than
 *    substrings of a sentence — `grep '"reqId":"a3f9c1d2"' server.log` finds
 *    everything about one failure.
 * 3. **Logging and responding in one call**, so it is not possible to return
 *    a 500 whose id was never logged, or to log an id the caller never got.
 *
 * Deliberately not a logging service, not OpenTelemetry, not pino. The need
 * is "grep one id" on a single small server; a dependency for that would cost
 * more than it returns.
 *
 * This module imports nothing from `next` on purpose. `apiError` returns a
 * plain `Response`, which Route Handlers accept and which `NextResponse`
 * itself extends — and that keeps the file loadable by the self-check
 * harness, which transpiles `lib/` and runs it under bare Node.
 *
 * **On the id's scope.** The obvious implementation is one id per HTTP
 * request, via React's `cache()`. That does not work here, and it fails
 * silently rather than loudly: `cache()` is scoped to a *render*, and a Route
 * Handler is not a render, so each call returns a fresh value. Measured, not
 * assumed — a probe route calling it twice in one request returned two
 * different ids. Getting true per-request scope would mean either an
 * `AsyncLocalStorage` wrapper around all twenty-five handlers or running the
 * Proxy on `/api` (its matcher currently excludes it) purely to mint an id.
 * Neither is worth it for a log line. So the id is minted per *failure*, and
 * the one handler that reports several failures in a single request — the
 * reminder cron, which logs once per seat it could not reach — mints one at
 * the top and passes it down.
 */

/** A fresh id. Eight hex characters: unique enough, and short enough to read
 * over a phone, which is how a bug report actually arrives here. */
export function newRequestId(): string {
  return randomUUID().slice(0, 8);
}

type Context = Record<string, string | number | boolean | null | undefined> & {
  /** Pass an existing id to tie several lines to the same request. */
  reqId?: string;
};

/**
 * One JSON line on stderr. Returns the id it used, so the caller can put it
 * in a response.
 */
export function logError(
  route: string,
  message: string,
  error?: unknown,
  context?: Context,
): string {
  const { reqId = newRequestId(), ...rest } = context ?? {};
  const line: Record<string, unknown> = {
    level: 'error',
    ts: new Date().toISOString(),
    reqId,
    route,
    message,
    ...rest,
  };

  if (error instanceof Error) {
    line.err = error.name;
    line.errMessage = error.message;
    // Kept in full: this goes to a server log, not to a user, and it is the
    // only thing that makes a 500 actionable after the fact.
    line.stack = error.stack;
  } else if (error !== undefined) {
    line.err = String(error);
  }

  console.error(JSON.stringify(line));
  return reqId;
}

/** The same shape at info level, for events that are not failures. */
export function logInfo(route: string, message: string, context?: Context): string {
  const { reqId = newRequestId(), ...rest } = context ?? {};
  console.log(JSON.stringify({
    level: 'info', ts: new Date().toISOString(), reqId, route, message, ...rest,
  }));
  return reqId;
}

/**
 * Log a failure and build the response for it.
 *
 * `message` is what the user sees, so it stays the honest, specific sentence
 * each route already had ("Failed to fetch attendance") rather than a generic
 * "Internal server error".
 */
export function apiError(
  route: string,
  message: string,
  error?: unknown,
  status = 500,
  context?: Context,
): Response {
  const reqId = logError(route, message, error, context);
  return Response.json(
    { error: message, reqId },
    { status, headers: { 'x-request-id': reqId } },
  );
}
