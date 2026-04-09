'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { Search, X, Command } from 'lucide-react';
import { cn, getSeatStatus } from '@/lib/utils';
import Badge, { type BadgeVariant } from '@/components/ui/Badge';
import { type Member } from '@/lib/types';
import { AnimatePresence, m } from 'framer-motion';

interface GlobalSearchProps {
  onSelect: (seat: number) => void;
  className?: string;
}

export default function GlobalSearch({ onSelect, className }: GlobalSearchProps) {
  const { members } = useMembers();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => clearTimeout(handler);
  }, [query]);

  // Derived filtered data using debounced query
  const results = useMemo<Member[]>(() => {
    if (!debouncedQuery) return [];
    
    const lower = debouncedQuery.toLowerCase();
    return members.filter(m => {
      const isOccupied = !m.vacant;
      const nameMatch = isOccupied && m.name.toLowerCase().includes(lower);
      const phoneMatch = isOccupied && m.phone?.includes(debouncedQuery);
      const seatMatch = String(m.seat).includes(debouncedQuery);
      return nameMatch || phoneMatch || seatMatch;
    }).slice(0, 5);
  }, [debouncedQuery, members]);

  // Toggle on Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Prevent toggling if user is typing in another input/textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) && target.id !== 'global-search-input') {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((open) => {
          if (!open) return true;
          return false;
        });
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "relative flex items-center bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-sm transition-all hover:border-sapphire-500/50 group h-[46px] px-4 w-full text-left cursor-pointer",
          className
        )}
      >
        <Search className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--sapphire-500)] transition-colors mr-3" />
        <span className="text-sm font-medium text-[var(--text-tertiary)] flex-1">
          Search name, phone, seat...
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-tertiary)] opacity-80 group-hover:opacity-100 transition-opacity shadow-sm">
          <Command className="w-3 h-3" /> K
        </kbd>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh]">
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-md"
            />
            
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full max-w-xl mx-4 bg-[var(--bg-surface)] rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden border border-[var(--border-default)]"
            >
              <div className="flex items-center px-4 py-4 border-b border-[var(--border-subtle)]">
                <Search className="w-5 h-5 text-[var(--sapphire-500)] mr-3 shrink-0" />
                <input
                  id="global-search-input"
                  ref={inputRef}
                  autoFocus
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="What are you looking for?"
                  className="flex-1 bg-transparent border-none text-base font-medium text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-tertiary)]"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="cursor-pointer p-1 rounded-full hover:bg-[var(--bg-base)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors ml-3 shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {query.trim() === '' ? (
                  <div className="p-8 pb-10 text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[var(--sapphire-500)]/10 flex items-center justify-center text-[var(--sapphire-500)] mb-4">
                      <Command className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Tip: Navigate faster</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">Search for a seat number directly or type a member&apos;s name.</p>
                  </div>
                ) : results.length > 0 ? (
                  <ul className="p-2 space-y-1">
                    {results.map((member: Member, i: number) => (
                      <m.li 
                        key={member.seat}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <button
                          onClick={() => {
                            onSelect(member.seat);
                            setQuery('');
                            setIsOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-[var(--bg-base)] rounded-xl transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[var(--sapphire-500)]/10 flex items-center justify-center text-[var(--sapphire-500)] font-mono font-bold border border-[var(--sapphire-500)]/20 shadow-[0_0_10px_var(--sapphire-500)] opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                              {String(member.seat).padStart(2, '0')}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[var(--text-primary)]">
                                {!member.vacant ? member.name : <span className="text-[var(--text-tertiary)] font-medium">Vacant</span>}
                              </p>
                              {!member.vacant && member.phone && (
                                <p className="text-xs text-[var(--text-tertiary)] mt-0.5 tracking-wider">
                                  {member.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          {!member.vacant && (
                            <div className="shrink-0 flex gap-2 items-center opacity-80 group-hover:opacity-100 transition-opacity">
                              <Badge variant={getSeatStatus(member) as BadgeVariant} className="scale-90" />
                            </div>
                          )}
                        </button>
                      </m.li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-[var(--text-tertiary)]">
                    <Search className="w-8 h-8 opacity-30 mx-auto mb-3" />
                    <p className="text-sm font-medium">No results found for &quot;{query}&quot;</p>
                  </div>
                )}
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
