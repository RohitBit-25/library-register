'use client';

import { useMembers } from '@/hooks/useMembers';
import LoadError from '@/components/ui/LoadError';

/**
 * Drop-in for staff pages built on the member list: says so when the list
 * failed to load, instead of the page reading "0 members" or "all seats free".
 * Shares the cached request with the page's own useMembers() (SWR dedupes).
 */
export default function MembersLoadError({ className = 'mb-6' }: { className?: string }) {
  const { loadFailed, retry } = useMembers();
  if (!loadFailed) return null;
  return <LoadError what="the member list" onRetry={retry} className={className} />;
}
