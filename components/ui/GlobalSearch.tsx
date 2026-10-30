'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { useAttendance } from '@/hooks/useAttendance';
import { useToast } from '@/hooks/useToast';
import { renewalStartDate, durationLabel } from '@/lib/utils';
import { Search, X, Command } from 'lucide-react';
import { cn, getSeatStatus } from '@/lib/utils';
import Badge, { type BadgeVariant } from '@/components/ui/Badge';
import { type Member } from '@/lib/types';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { Dialog } from 'radix-ui';
import { springUI } from '@/lib/motion';

interface GlobalSearchProps {
  onSelect: (seat: number) => void;
  className?: string;
}

function useMemberSearch(query: string, members: Member[]) {
  const [debouncedQuery, setDebouncedQuery] = useState('');

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

  // True for the 150 ms before the results catch up with what was typed.
  return { results, debouncedQuery, pending: debouncedQuery !== query };
}

type CommandKind = 'renew' | 'paid' | 'checkin' | 'open';

/**
 * "renew 41", "paid 12", "check in 7", "open 41" — the jobs staff do all
 * day, typed instead of clicked through. Vacate is left out on purpose: it is
 * the one that should take a deliberate, confirmed step.
 */
function parseCommand(q: string): { kind: CommandKind; seat: number } | null {
  const m = q.trim().toLowerCase().match(/^(renew|paid|mark paid|pay|check ?in|in|open|seat)\s+#?(\d{1,2})$/);
  if (!m) return null;
  const verb = m[1];
  const kind: CommandKind = verb === 'renew' ? 'renew'
    : verb === 'paid' || verb === 'mark paid' || verb === 'pay' ? 'paid'
    : verb === 'open' || verb === 'seat' ? 'open' : 'checkin';
  return { kind, seat: Number(m[2]) };
}

function useCommandPalette(setIsOpen: React.Dispatch<React.SetStateAction<boolean>>) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Prevent toggling if user is typing in another input/textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) && target.id !== 'global-search-input') {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setIsOpen]);
}

export default function GlobalSearch({ onSelect, className }: GlobalSearchProps) {
  const { members, renew, update } = useMembers();
  const { markPresent, todayStr, isPresent } = useAttendance();
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const parsed = parseCommand(query);
  const target = parsed ? members.find((x) => x.seat === parsed.seat && !x.vacant) ?? null : null;
  const { results, debouncedQuery, pending } = useMemberSearch(parsed ? String(parsed.seat) : query, members);

  const commandLabel = (() => {
    if (!parsed || !target) return null;
    const who = `${target.name} · seat ${target.seat}`;
    if (parsed.kind === 'renew') return { verb: `Renew ${durationLabel((target.duration || '3M') as never)}, same plan`, who };
    if (parsed.kind === 'paid') return target.fee === 'due' ? { verb: 'Mark fee paid', who } : { verb: 'Fee is already paid', who, disabled: true };
    if (parsed.kind === 'checkin') return isPresent(todayStr, target.seat) ? { verb: 'Already checked in today', who, disabled: true } : { verb: 'Check in for today', who };
    return { verb: 'Open seat', who };
  })();

  const openerRef = useRef<HTMLElement | null>(null);
  const close = () => { setQuery(''); setIsOpen(false); };
  const runCommand = async () => {
    if (!parsed || !target || !commandLabel || commandLabel.disabled) return;
    const err = (msg: string) => addToast('error', msg);
    if (parsed.kind === 'renew') {
      const plan = (target.duration || '3M') as '1M' | '3M' | '6M' | '1Y';
      renew(target.seat, renewalStartDate(target.expiry), plan, err);
      addToast('success', `${target.name} renewed for ${durationLabel(plan)}`);
    } else if (parsed.kind === 'paid') {
      update(target.seat, { fee: 'paid' }, err);
      addToast('success', `Seat ${target.seat} marked paid`);
    } else if (parsed.kind === 'checkin') {
      const ok = await markPresent(todayStr, target.seat);
      addToast(ok ? 'success' : 'error', ok ? `${target.name} checked in` : 'Check-in did not save');
    } else {
      onSelect(target.seat);
    }
    close();
  };
  useCommandPalette(setIsOpen);

  // `m` components only animate inside LazyMotion. Without it the palette
  // stayed at its initial opacity: 0 — open, focused, and invisible.
  return (
    <LazyMotion features={domAnimation}>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "relative flex items-center bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-sm transition-ui hover:border-[var(--sapphire-200)] group h-[46px] px-4 w-full text-left cursor-pointer",
          className
        )}
      >
        <Search className="size-4 text-[var(--text-tertiary)] group-hover:text-[var(--sapphire-600)] transition-colors mr-3" />
        <span className="text-sm font-medium text-[var(--text-tertiary)] flex-1">
          Search name, phone, seat...
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-tertiary)] opacity-80 group-hover:opacity-100 transition-opacity shadow-sm">
          <Command className="size-4" /> K
        </kbd>
      </button>

      {/* Radix Dialog, as in the request sheet: Escape and a backdrop click
          close it, Tab stays inside, focus goes back to where it was. */}
      <Dialog.Root open={isOpen} onOpenChange={(o) => { if (!o) close(); }}>
        <Dialog.Portal>
          <Dialog.Overlay asChild>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 bg-[var(--text-primary)]/40"
            />
          </Dialog.Overlay>
          <Dialog.Content
            asChild
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => {
              // Read before moving focus: this is the button or field that opened it.
              openerRef.current = document.activeElement as HTMLElement | null;
              e.preventDefault();
              inputRef.current?.focus();
            }}
            onCloseAutoFocus={(e) => {
              // No Dialog.Trigger here (⌘K opens it too), so put focus back by hand.
              e.preventDefault();
              if (openerRef.current?.isConnected) openerRef.current.focus();
            }}
          >
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={springUI}
              className="fixed left-1/2 top-[15vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 bg-[var(--bg-surface)] rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden border border-[var(--border-default)]"
            >
              <Dialog.Title className="sr-only">Search</Dialog.Title>
              <div className="flex items-center px-4 py-4 border-b border-[var(--border-subtle)]">
                <Search className="size-5 text-[var(--sapphire-600)] mr-3 shrink-0" aria-hidden="true" />
                <input
                  id="global-search-input"
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    if (commandLabel) runCommand();
                    else if (results[0]) { onSelect(results[0].seat); close(); }
                  }}
                  placeholder="What are you looking for?"
                  // A placeholder is not an accessible name: it vanishes as
                  // soon as you type, and many screen readers skip it.
                  aria-label="Search members and seats"
                  className="flex-1 bg-transparent border-none text-base font-medium text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-tertiary)]"
                />
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close search"
                  className="cursor-pointer p-1 rounded-full hover:bg-[var(--bg-base)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors ml-3 shrink-0"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {query.trim() === '' ? (
                  <div className="p-8 pb-10 text-center flex flex-col items-center">
                    <div className="size-12 rounded-full bg-[var(--sapphire-50)] flex items-center justify-center text-[var(--sapphire-600)] mb-4">
                      <Command className="size-6" />
                    </div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Search, or type a command</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">A name, phone or seat number — or</p>
                    <p className="mt-2 flex flex-wrap justify-center gap-1.5 font-mono text-xs text-[var(--text-secondary)]">
                      {['renew 41', 'paid 12', 'check in 7', 'open 41'].map((c) => (
                        <button key={c} type="button" onClick={() => { setQuery(c); inputRef.current?.focus(); }} className="cursor-pointer rounded-md border border-[var(--border-default)] px-2 py-1 hover:bg-[var(--bg-muted)]">{c}</button>
                      ))}
                    </p>
                  </div>
                ) : results.length > 0 || commandLabel ? (
                  <ul className="p-2 space-y-1">
                    {commandLabel && (
                      <li>
                        <button
                          type="button"
                          onClick={runCommand}
                          disabled={commandLabel.disabled}
                          className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--saffron-200)] bg-[var(--saffron-50)] px-4 py-3 text-left transition-ui hover:bg-[var(--saffron-100)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span>
                            <span className="block text-sm font-bold text-[var(--saffron-700)]">{commandLabel.verb}</span>
                            <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">{commandLabel.who}</span>
                          </span>
                          {!commandLabel.disabled && <kbd className="rounded-md border border-[var(--saffron-200)] bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-xs text-[var(--saffron-700)]">Enter</kbd>}
                        </button>
                      </li>
                    )}
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
                          className="w-full text-left px-4 py-3 hover:bg-[var(--bg-base)] rounded-xl transition-ui flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-[var(--sapphire-50)] flex items-center justify-center text-[var(--sapphire-600)] font-mono font-bold border border-[var(--sapphire-200)] shadow-[var(--shadow-sm)] opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-ui">
                              {String(member.seat).padStart(2, '0')}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[var(--text-primary)]">
                                {!member.vacant ? member.name : <span className="text-[var(--text-tertiary)] font-medium">Vacant</span>}
                              </p>
                              {!member.vacant && member.phone && (
                                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
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
                    <Search className="size-8 opacity-30 mx-auto mb-3" />
                    {/* Mid-debounce the results are stale; say nothing rather than 'No results for ""'. */}
                    <p className={cn('text-sm font-medium', pending && 'invisible')}>No results found for &quot;{debouncedQuery}&quot;</p>
                  </div>
                )}
              </div>
            </m.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </LazyMotion>
  );
}
