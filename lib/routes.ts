/**
 * Which pages a visitor may open, and which need a staff session.
 *
 * One list for proxy.ts (server redirect) and AppShell (client chrome).
 * scripts/selfcheck.mjs fails if a page under app/ is on neither list, so a
 * new staff page cannot ship public by being forgotten here.
 */
export const PUBLIC_ROUTES = ['/landing', '/browse', '/my-requests', '/kiosk', '/admin/login'];

export const ADMIN_ROUTES = [
  '/', '/members', '/analytics', '/requests', '/floorplan',
  '/audit', '/export', '/attendance', '/expiry', '/setup', '/payments', '/staff',
];
