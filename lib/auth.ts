/**
 * Client-side auth helpers.
 *
 * This file used to also hold a localStorage-backed "role" store, so a
 * visitor could mark themselves a `user` in the browser. Nothing granted
 * privilege from it — admin status has always come from the server session —
 * and nothing ever set it, so it only served to make /browse unreachable.
 * Removed with the role itself; see hooks/useAuth.tsx.
 */
export async function loginAsAdminService(
  pin: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
      credentials: 'same-origin',
    });

    if (res.ok) return { ok: true };

    // Surface the server's message so the user sees "3 attempts left" or the
    // lockout window rather than a generic failure.
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.error || 'Login failed. Please try again.' };
  } catch {
    return { ok: false, error: 'Network error. Check your connection.' };
  }
}
