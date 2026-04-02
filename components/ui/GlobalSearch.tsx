'use client';

import { useState, useRef, useEffect } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { Search, X } from 'lucide-react';
import { cn, getSeatStatus } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import { AnimatePresence, m } from 'framer-motion';

interface GlobalSearchProps {
  onSelect: (seat: number) => void;
}

export default function GlobalSearch({ onSelect }: GlobalSearchProps) {
  const { members } = useMembers();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter members
  const results = query.trim() === '' ? [] : members.filter(m => {
    const q = query.toLowerCase();
    const isOccupied = !m.vacant;
    const nameMatch = isOccupied && m.name.toLowerCase().includes(q);
    const phoneMatch = isOccupied && m.phone?.includes(q);
    const seatMatch = String(m.seat).includes(q);
    return nameMatch || phoneMatch || seatMatch;
  }).slice(0, 5); // Limit to top 5 results

  return (
    <div ref={wrapperRef} className="relative w-full max-w-lg mx-auto mb-6 z-40">
      <div className={cn(
        "relative flex items-center bg-surface dark:bg-surface-dark border rounded-2xl transition-all shadow-sm",
        isFocused ? "border-sapphire-500 ring-4 ring-sapphire-500/20" : "border-card-border dark:border-card-border-dark hover:border-sapphire-500/50"
      )}>
        <Search className="absolute left-4 w-5 h-5 text-text-tertiary dark:text-text-tertiary-dark" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search member name, phone, or seat #..."
          className="w-full bg-transparent border-none py-3.5 pl-11 pr-10 text-sm font-medium text-text-primary dark:text-text-primary-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary-dark focus:outline-none"
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setIsFocused(false); }}
            className="absolute right-3 p-1 rounded-full hover:bg-bg dark:hover:bg-bg-dark text-text-tertiary dark:text-text-tertiary-dark cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFocused && query.trim() !== '' && (
          <m.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 bg-surface dark:bg-surface-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xl overflow-hidden"
          >
            {results.length > 0 ? (
              <ul className="divide-y divide-card-border/50 dark:divide-card-border-dark/50">
                {results.map(member => (
                  <li key={member.seat}>
                    <button
                      onClick={() => {
                        onSelect(member.seat);
                        setQuery('');
                        setIsFocused(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-bg/80 dark:hover:bg-bg-dark/80 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sapphire-500/10 flex items-center justify-center text-sapphire-500 font-mono font-bold border border-sapphire-500/20 group-hover:scale-105 transition-transform">
                          {String(member.seat).padStart(2, '0')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
                            {!member.vacant ? member.name : <span className="text-text-tertiary font-medium">Vacant</span>}
                          </p>
                          {!member.vacant && member.phone && (
                            <p className="text-xs text-text-tertiary dark:text-text-tertiary-dark mt-0.5 tracking-wider">
                              {member.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      {!member.vacant && (
                        <div className="shrink-0 flex gap-2 items-center">
                          <Badge status={getSeatStatus(member)} size="sm" />
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-text-tertiary dark:text-text-tertiary-dark">
                <Search className="w-8 h-8 opacity-50 mx-auto mb-3" />
                <p className="text-sm font-medium">No results found for &quot;{query}&quot;</p>
                <p className="text-xs mt-1 opacity-70">Try searching by seat number or phone</p>
              </div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
