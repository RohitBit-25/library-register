'use client';

import { createContext, useContext, useCallback, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import useSWR from 'swr';
import {
  type UserRole,
  getStoredRole,
  setStoredRole,
  loginAsAdminService,
  subscribeToRole,
  getRoleServerSnapshot,
} from '@/lib/auth';

// ─── Context Shape ──────────────────────────────────────────────

interface AuthContextValue {
  role: UserRole | null;
  isAdmin: boolean;
  isUser: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginAsAdmin: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  loginAsUser: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  role: null,
  isAdmin: false,
  isUser: false,
  isAuthenticated: false,
  isLoading: true,
  loginAsAdmin: async () => ({ ok: false }),
  loginAsUser: () => {},
  logout: () => {},
});

const checkFetcher = async (url: string): Promise<{ isAdmin: boolean }> => {
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
  const { data, isLoading, mutate } = useSWR('/api/auth/check', checkFetcher, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
  const isAdmin = data?.isAdmin === true;

  // The "user" role carries no privilege, so localStorage is fine for it.
  const [userOptedIn, setUserOptedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUserOptedIn(getStoredRole() === 'user');
    setHydrated(true);
  }, []);

  const loginAsAdmin = useCallback(async (pin: string) => {
    const result = await loginAsAdminService(pin);
    if (result.ok) await mutate();
    return result;
  }, [mutate]);

  const loginAsUser = useCallback(() => {
    setStoredRole('user');
    setUserOptedIn(true);
  }, []);

  const logout = useCallback(() => {
    setStoredRole(null);
    setUserOptedIn(false);
    fetch('/api/auth/logout', { method: 'POST' })
      .catch(() => {})
      .finally(() => { mutate({ isAdmin: false }, { revalidate: true }); });
  }, [mutate]);

  const role: UserRole | null = isAdmin ? 'admin' : userOptedIn ? 'user' : null;

  const value = useMemo(() => ({
    role,
    isAdmin,
    isUser: role === 'user',
    isAuthenticated: role !== null,
    isLoading: isLoading || !hydrated,
    loginAsAdmin,
    loginAsUser,
    logout,
  }), [role, isAdmin, isLoading, hydrated, loginAsAdmin, loginAsUser, logout]);

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
