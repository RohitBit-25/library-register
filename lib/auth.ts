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
const ADMIN_PIN_KEY = 'library-admin-pin';
const DEFAULT_PIN = '1234';

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

// ─── Admin PIN ──────────────────────────────────────────────────

export function getAdminPin(): string {
  if (typeof window === 'undefined') return DEFAULT_PIN;
  return localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_PIN;
}

export function setAdminPin(pin: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_PIN_KEY, pin);
}

export function verifyAdminPin(pin: string): boolean {
  return pin === getAdminPin();
}

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
