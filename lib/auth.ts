// ─── Role-Based Access Types & Helpers ──────────────────────────

export type UserRole = 'admin' | 'user';

export interface SeatRequest {
  id: string;
  seat: number;
  userName: string;
  userPhone: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; // ISO date
}

// ─── Storage Keys ───────────────────────────────────────────────

const ROLE_KEY = 'library-role';
const REQUESTS_KEY = 'library-seat-requests';

// ─── Role Persistence ───────────────────────────────────────────

export function getStoredRole(): UserRole | null {
  if (typeof window === 'undefined') return null;
  const role = localStorage.getItem(ROLE_KEY);
  if (role === 'admin' || role === 'user') return role;
  return null;
}

export function setStoredRole(role: UserRole | null): void {
  if (typeof window === 'undefined') return;
  if (role) {
    localStorage.setItem(ROLE_KEY, role);
  } else {
    localStorage.removeItem(ROLE_KEY);
  }
}

export async function loginAsAdminService(pin: string): Promise<boolean> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    return res.ok;
  } catch (err) {
    console.error('Admin login service error:', err);
    return false;
  }
}

// Admin verification is handled on the server side via /api/auth.
// Local role persistence is managed via setStoredRole('admin').

// ─── Seat Requests ──────────────────────────────────────────────

export function getStoredRequests(): SeatRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function saveRequests(requests: SeatRequest[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  window.dispatchEvent(new Event('requests-updated'));
}

export function generateRequestId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
