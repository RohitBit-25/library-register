'use client';

import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import {
  loginAsAdminService,
} from '@/lib/auth';

// ─── Context Shape ──────────────────────────────────────────────

/**
 * There is exactly one kind of account in this product: staff.
 *
 * A second "user" role used to live here, granted by writing
 * `library-role=user` into localStorage. Nothing ever called the function
 * that set it, so `isAuthenticated` was false for every real visitor — and
 * AppShell required it everywhere except /landing and /kiosk. The result was
 * that /browse and /my-requests redirected students back to the landing
 * page, and the landing page's own "Choose Your Seat" button led nowhere.
 *
 * The student side needs no account at all: browsing the plan and submitting
 * a request are public, and the request carries the phone number the admin
 * needs. So the role is gone rather than fixed, and `isAdmin` — which comes
 * from the server session, never from localStorage — is the only question
 * this hook answers.
 */
interface AuthContextValue {
  isAdmin: boolean;
  /** Signed-in staff member's name, or null. */
  staffName: string | null;
  /** Owners can manage staff; staff cannot. */
  isOwner: boolean;
  isLoading: boolean;
  loginAsAdmin: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isAdmin: false,
  staffName: null,
  isOwner: false,
  isLoading: true,
  loginAsAdmin: async () => ({ ok: false }),
  logout: () => {},
});

interface SessionInfo { isAdmin: boolean; name?: string; role?: 'owner' | 'staff' }

const checkFetcher = async (url: string): Promise<SessionInfo> => {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) return { isAdmin: false };
  return res.json();
};

// ─── Provider ───────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  // Admin comes from the server session cookie, never from localStorage.
  // Previously `isAdmin` was read straight out of localStorage, so setting
  // `library-role=admin` in devtools revealed the whole admin UI (every action
  // then 401'd — a confusing failure, not a real boundary).
  const { mutate: globalMutate } = useSWRConfig();
  const { data, isLoading, mutate } = useSWR<SessionInfo>('/api/auth/check', checkFetcher, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
  const isAdmin = data?.isAdmin === true;
  // Who is signed in — every audit row now carries this name.
  const staffName = data?.name ?? null;
  const isOwner = data?.role === 'owner';

  // Every endpoint returns different data per role — /api/members is redacted
  // for anonymous callers, /api/requests 401s. AppShell mounts useMembers()
  // even on /landing, so SWR has already cached the anonymous responses by the
  // time someone logs in. Without this the admin sees the redacted list
  // (every member named "Occupied") until a hard refresh.
  const invalidateAll = useCallback(
    () => globalMutate(() => true, undefined, { revalidate: true }),
    [globalMutate]
  );

  const loginAsAdmin = useCallback(async (pin: string) => {
    const result = await loginAsAdminService(pin);
    if (result.ok) {
      await mutate();
      await invalidateAll();
    }
    return result;
  }, [mutate, invalidateAll]);

  const logout = useCallback(() => {
    fetch('/api/auth/logout', { method: 'POST' })
      .catch(() => {})
      .finally(() => {
        mutate({ isAdmin: false }, { revalidate: true });
        // Drop cached admin data so it can't be read back after sign-out.
        invalidateAll();
      });
  }, [mutate, invalidateAll]);


  const value = useMemo(() => ({
    isAdmin,
    staffName,
    isOwner,
    isLoading,
    loginAsAdmin,
    logout,
  }), [isAdmin, staffName, isOwner, isLoading, loginAsAdmin, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
