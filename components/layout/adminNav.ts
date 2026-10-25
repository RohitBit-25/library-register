import {
  Armchair, Map, Inbox, Users, IndianRupee, CalendarClock, ClipboardCheck,
  BarChart3, ScrollText, Download, UserCog, QrCode, type LucideIcon,
} from 'lucide-react';

/**
 * One list for every admin nav surface. The sidebar and the phone tab bar
 * kept their own copies and drifted: `/` was "Dashboard" in one and "Map" in
 * the other, and /attendance and /expiry were in neither, so two working
 * pages could only be reached by typing the URL.
 */
export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the phone tab bar (max five). */
  tab?: string;
}

export const ADMIN_NAV: { group: string; items: AdminNavItem[] }[] = [
  {
    group: 'Desk',
    items: [
      { href: '/', label: 'Seats', icon: Armchair, tab: 'Seats' },
      { href: '/requests', label: 'Requests', icon: Inbox, tab: 'Requests' },
      { href: '/members', label: 'Members', icon: Users, tab: 'Members' },
      { href: '/payments', label: 'Collections', icon: IndianRupee, tab: 'Fees' },
      { href: '/expiry', label: 'Renewals', icon: CalendarClock },
      { href: '/attendance', label: 'Attendance', icon: ClipboardCheck },
    ],
  },
  {
    group: 'Records',
    items: [
      { href: '/analytics', label: 'Analytics', icon: BarChart3, tab: 'Reports' },
      { href: '/audit', label: 'Activity log', icon: ScrollText },
      { href: '/export', label: 'Export', icon: Download },
    ],
  },
  {
    group: 'Setup',
    items: [
      { href: '/floorplan', label: 'Full floor plan', icon: Map },
      { href: '/staff', label: 'Staff', icon: UserCog },
      { href: '/kiosk', label: 'Check-in kiosk', icon: QrCode },
    ],
  },
];

export const ADMIN_TABS = ADMIN_NAV.flatMap((g) => g.items).filter((i) => i.tab);
