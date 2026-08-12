// ─── Role-Based Access Types & Helpers ──────────────────────────

export type UserRole = 'admin' | 'user';

// Only the privilege-free "user" opt-in is persisted here. Admin status comes
// from the httpOnly session cookie via /api/auth/check — see hooks/useAuth.tsx.
const ROLE_KEY = 'library-role';

const ROLE_EVENT = 'library-role-change';

export function getStoredRole(): UserRole | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ROLE_KEY) === 'user' ? 'user' : null;
}

export function setStoredRole(role: UserRole | null): void {
  if (typeof window === 'undefined') return;
  if (role === 'user') {
    localStorage.setItem(ROLE_KEY, role);
  } else {
    localStorage.removeItem(ROLE_KEY);
  }
  // `storage` only fires in *other* tabs, so notify this one explicitly.
  window.dispatchEvent(new Event(ROLE_EVENT));
}

// ─── useSyncExternalStore adapter ───────────────────────────────
// localStorage is an external store; reading it in an effect and calling
// setState causes a cascading render (and the React Compiler flags it).

export function subscribeToRole(onChange: () => void): () => void {
  window.addEventListener(ROLE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(ROLE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** Server render has no localStorage — must return a stable value. */
export function getRoleServerSnapshot(): UserRole | null {
  return null;
}

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
