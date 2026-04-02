'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type UserRole, getStoredRole, setStoredRole, verifyAdminPin } from '@/lib/auth';

// ─── Context Shape ──────────────────────────────────────────────

interface AuthContextValue {
  role: UserRole | null;
  isAdmin: boolean;
  isUser: boolean;
  isAuthenticated: boolean;
  loginAsAdmin: (pin: string) => Promise<boolean>;
  loginAsUser: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  role: null,
  isAdmin: false,
  isUser: false,
  isAuthenticated: false,
  loginAsAdmin: async () => false,
  loginAsUser: () => {},
  logout: () => {},
});

// ─── Provider ───────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = getStoredRole();
    setRole(stored);
    setHydrated(true);
  }, []);

  const loginAsAdmin = useCallback(async (pin: string): Promise<boolean> => {
    if (verifyAdminPin(pin)) {
      // Set the server-side JWT cookie for API route protection
      try {
        await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin }),
        });
      } catch {
        // Server auth is a bonus layer; client-side still works
      }

      setRole('admin');
      setStoredRole('admin');
      return true;
    }
    return false;
  }, []);

  const loginAsUser = useCallback(() => {
    setRole('user');
    setStoredRole('user');
  }, []);

  const logout = useCallback(() => {
    // Clear server-side JWT cookie
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});

    setRole(null);
    setStoredRole(null);
  }, []);

  const value: AuthContextValue = {
    role,
    isAdmin: role === 'admin',
    isUser: role === 'user',
    isAuthenticated: role !== null,
    loginAsAdmin,
    loginAsUser,
    logout,
  };

  // Don't render until hydrated to avoid flash
  if (!hydrated) {
    return null;
  }

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
