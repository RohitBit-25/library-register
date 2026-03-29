'use client';

import { useMemo } from 'react';
import { type Member, type Stats } from '@/lib/types';
import { getSeatStatus, daysUntilExpiry } from '@/lib/utils';

export function useStats(members: Member[]): Stats {
  return useMemo(() => {
    let occupied = 0;
    let vacant = 0;
    let due = 0;
    let expiring = 0;
    let expired = 0;
    const byDuration: Record<string, number> = { '1M': 0, '3M': 0, '6M': 0, '1Y': 0 };
    const expiringThisWeek: Member[] = [];
    const dueMembers: Member[] = [];
    const expiredMembers: Member[] = [];

    for (const m of members) {
      if (m.vacant) {
        vacant++;
        continue;
      }
      occupied++;
      if (m.duration) {
        byDuration[m.duration] = (byDuration[m.duration] || 0) + 1;
      }
      const status = getSeatStatus(m);
      switch (status) {
        case 'due':
          due++;
          dueMembers.push(m);
          break;
        case 'expired':
          expired++;
          expiredMembers.push(m);
          break;
        case 'expiring':
          expiring++;
          expiringThisWeek.push(m);
          break;
      }
    }

    // Sort by urgency: expired first, then due, then expiring
    expiredMembers.sort((a, b) => daysUntilExpiry(a.expiry) - daysUntilExpiry(b.expiry));
    expiringThisWeek.sort((a, b) => daysUntilExpiry(a.expiry) - daysUntilExpiry(b.expiry));

    return {
      occupied,
      vacant,
      due,
      expiring,
      expired,
      byDuration,
      expiringThisWeek,
      dueMembers,
      expiredMembers,
    };
  }, [members]);
}
