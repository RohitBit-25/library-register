'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type UserRole, getStoredRole, setStoredRole, verifyAdminPin } from '@/lib/auth';

// ─── Context Shape ──────────────────────────────────────────────

interface AuthContextValue {
  role: UserRole | null;
  isAdmin: boolean;
  isUser: boolean;
  isAuthenticated: boolean;
  loginAsAdmin: (pin: string) => boolean;
  loginAsUser: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  role: null,
  isAdmin: false,
  isUser: false,
  isAuthenticated: false,
  loginAsAdmin: () => false,
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

  const loginAsAdmin = useCallback((pin: string): boolean => {
    if (verifyAdminPin(pin)) {
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
