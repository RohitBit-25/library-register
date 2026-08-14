'use client';

import { useState } from 'react';
import { Armchair, CalendarDays, Clock, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

type SidebarItem = 'select_seat' | 'my_booking' | 'history' | 'profile' | 'logout';

export default function StudentSidebar() {
  const [activeTab, setActiveTab] = useState<SidebarItem>('select_seat');
  const { logout } = useAuth();
  const router = useRouter();

  const handleTabClick = (tab: SidebarItem) => {
    if (tab === 'logout') {
      logout();
      router.push('/landing');
      return;
    }
    setActiveTab(tab);
  };

  const navItems = [
    { id: 'select_seat', label: 'Select Seat', icon: Armchair },
    { id: 'my_booking', label: 'My Booking', icon: CalendarDays },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'logout', label: 'Logout', icon: LogOut },
  ] as const;

  return (
    <aside className="hidden lg:flex flex-col w-[120px] border-r border-[var(--border-default)] bg-[var(--bg-surface)] py-6 shrink-0">
      <nav className="flex flex-col gap-6 items-center">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isLogout = item.id === 'logout';
          
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                "group flex w-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl p-3 transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)] focus-visible:ring-offset-2",
                isActive 
                  ? "bg-[var(--saffron-50)] text-[var(--saffron-700)]" 
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]",
                isLogout && "mt-auto !text-[var(--text-tertiary)] hover:!text-[var(--ruby-600)] hover:!bg-[var(--ruby-50)]"
              )}
            >
              <item.icon 
                className={cn(
                  "w-6 h-6 transition-transform group-hover:scale-110",
                  isActive ? "text-[var(--saffron-600)]" : "text-current"
                )} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                "text-[10px] font-bold text-center leading-tight",
                isActive ? "text-[var(--saffron-700)]" : "text-current"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
