'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { type UserRole, getStoredRole, setStoredRole } from '@/lib/auth';

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
  const [state, setState] = useState<{ role: UserRole | null; hydrated: boolean }>({
    role: null,
    hydrated: false,
  });

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = getStoredRole();
    const timer = setTimeout(() => {
      setState({ role: stored, hydrated: true });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const loginAsAdmin = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        setState(prev => ({ ...prev, role: 'admin' }));
        setStoredRole('admin');
        return true;
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
    return false;
  }, []);

  const loginAsUser = useCallback(() => {
    setState(prev => ({ ...prev, role: 'user' }));
    setStoredRole('user');
  }, []);

  const logout = useCallback(() => {
    // Clear server-side JWT cookie
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});

    setState(prev => ({ ...prev, role: null }));
    setStoredRole(null);
  }, []);

  const value = useMemo(() => ({
    role: state.role,
    isAdmin: state.role === 'admin',
    isUser: state.role === 'user',
    isAuthenticated: state.role !== null,
    loginAsAdmin,
    loginAsUser,
    logout,
  }), [state.role, loginAsAdmin, loginAsUser, logout]);

  // Don't render until hydrated to avoid flash
  if (!state.hydrated) {
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
