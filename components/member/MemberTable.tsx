'use client';

import { useState, useMemo } from 'react';
import { type Member, type SeatStatus } from '@/lib/types';
import { getSeatStatus, fmtDateShort, cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import { Search, MoreVertical, Check, RefreshCw, MessageCircle, Trash2, UserPlus, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface MemberTableProps {
  members: Member[];
  onMarkPaid: (seat: number) => void;
  onMarkDue: (seat: number) => void;
  onRenew: (seat: number) => void;
  onRemove: (seat: number) => void;
  onBulkMarkPaid: (seats: number[]) => void;
  onBulkRemove: (seats: number[]) => void;
  onBulkExport: (seats: number[]) => void;
  onBulkWhatsApp: (seats: number[]) => void;
}

type SortField = 'seat' | 'name' | 'expiry' | 'joinDate';
type FilterType = 'all' | SeatStatus | 'morning' | 'evening';

function SortIcon({ field, currentField, asc }: { field: SortField; currentField: SortField; asc: boolean }) {
  if (field !== currentField) return null;
  return asc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />;
}

export default function MemberTable({
  members,
  onMarkPaid,
  onMarkDue,
  onRenew,
  onRemove,
  onBulkMarkPaid,
  onBulkRemove,
  onBulkExport,
  onBulkWhatsApp,
}: MemberTableProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('seat');
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [openActions, setOpenActions] = useState<number | null>(null);

  // Filter & sort
  const filtered = useMemo(() => {
    let result = [...members];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) ||
        String(m.seat).includes(q) ||
        m.phone.includes(q)
      );
    }

    // Filter
    if (filter !== 'all') {
      if (filter === 'morning' || filter === 'evening') {
        result = result.filter(m => !m.vacant && (m.shift === filter || m.shift === 'full'));
      } else {
        result = result.filter(m => getSeatStatus(m) === filter);
      }
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'seat': cmp = a.seat - b.seat; break;
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'expiry': cmp = (a.expiry || 'z').localeCompare(b.expiry || 'z'); break;
        case 'joinDate': cmp = (a.joinDate || 'z').localeCompare(b.joinDate || 'z'); break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [members, search, filter, sortField, sortAsc]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(prev => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const toggleSelect = (seat: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(seat)) next.delete(seat);
      else next.add(seat);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.filter(m => !m.vacant).length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.filter(m => !m.vacant).map(m => m.seat)));
    }
  };

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'expiring', label: 'Expiring' },
    { value: 'expired', label: 'Expired' },
    { value: 'due', label: 'Fee Due' },
    { value: 'vacant', label: 'Vacant' },
    { value: 'morning', label: 'Morning' },
    { value: 'evening', label: 'Evening' },
  ];


  return (
    <div>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-blue-accent/10 p-3 animate-fade-in">
          <span className="text-sm font-medium text-blue-accent">
            {selected.size} selected
          </span>
          <button
            onClick={() => { onBulkMarkPaid(Array.from(selected)); setSelected(new Set()); }}
            className="cursor-pointer rounded-md bg-active-border px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
          >
            Mark Paid
          </button>
          <button
            onClick={() => { onBulkRemove(Array.from(selected)); setSelected(new Set()); }}
            className="cursor-pointer rounded-md bg-expired-border px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
          >
            Remove
          </button>
          <button
            onClick={() => onBulkWhatsApp(Array.from(selected))}
            className="cursor-pointer rounded-md bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
          >
            WhatsApp
          </button>
          <button
            onClick={() => onBulkExport(Array.from(selected))}
            className="cursor-pointer rounded-md bg-active-fill px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-active-border hover:text-white transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="cursor-pointer text-xs text-text-secondary dark:text-text-secondary-dark ml-auto hover:text-text-primary dark:hover:text-text-primary-dark"
          >
            Clear
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary dark:text-text-tertiary-dark" />
        <input
          type="search"
          placeholder="Search name, seat, phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-card-border dark:border-card-border-dark bg-input-bg dark:bg-input-bg-dark pl-9 pr-4 py-2.5 text-sm text-text-primary dark:text-text-primary-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary-dark focus:outline-none focus:ring-2 focus:ring-blue-accent/30 focus:border-blue-accent/50"
        />
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border',
              filter === f.value
                ? 'bg-blue-accent text-white border-blue-accent'
                : 'bg-surface dark:bg-surface-dark border-card-border dark:border-card-border-dark text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-card-border dark:border-card-border-dark">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border dark:border-card-border-dark bg-bg dark:bg-bg-dark">
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  checked={selected.size === filtered.filter(m => !m.vacant).length && selected.size > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded cursor-pointer accent-blue-accent"
                />
              </th>
              <th className="text-left p-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort('seat')}>
                <span className="flex items-center gap-1">Seat <SortIcon field="seat" currentField={sortField} asc={sortAsc} /></span>
              </th>
              <th className="text-left p-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort('name')}>
                <span className="flex items-center gap-1">Name <SortIcon field="name" currentField={sortField} asc={sortAsc} /></span>
              </th>
              <th className="text-left p-3 font-semibold">Phone</th>
              <th className="text-left p-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort('joinDate')}>
                <span className="flex items-center gap-1">Joined <SortIcon field="joinDate" currentField={sortField} asc={sortAsc} /></span>
              </th>
              <th className="text-left p-3 font-semibold">Dur.</th>
              <th className="text-left p-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort('expiry')}>
                <span className="flex items-center gap-1">Expiry <SortIcon field="expiry" currentField={sortField} asc={sortAsc} /></span>
              </th>
              <th className="text-left p-3 font-semibold">Status</th>
              <th className="w-10 p-3" />
            </tr>
          </thead>
          <motion.tbody 
            initial={false}
            className="divide-y divide-card-border/30 dark:divide-card-border-dark/30"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map(m => {
                const status = getSeatStatus(m);
                return (
                  <motion.tr
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    key={m.seat}
                    className={cn(
                      'border-b border-card-border/50 dark:border-card-border-dark/50 transition-colors',
                      selected.has(m.seat) && 'bg-blue-accent/5',
                      !m.vacant && 'hover:bg-bg/60 dark:hover:bg-bg-dark/60',
                    )}
                  >
                  <td className="p-3">
                    {!m.vacant && (
                      <input
                        type="checkbox"
                        checked={selected.has(m.seat)}
                        onChange={() => toggleSelect(m.seat)}
                        className="w-4 h-4 rounded cursor-pointer accent-blue-accent"
                      />
                    )}
                  </td>
                  <td className="p-3 font-mono font-medium text-text-primary dark:text-text-primary-dark">
                    {m.seat}
                  </td>
                  <td className="p-3 font-medium text-text-primary dark:text-text-primary-dark">
                    {m.vacant ? (
                      <span className="text-text-tertiary dark:text-text-tertiary-dark italic">(Vacant)</span>
                    ) : m.name}
                  </td>
                  <td className="p-3 text-text-secondary dark:text-text-secondary-dark">{m.phone || '—'}</td>
                  <td className="p-3 text-text-secondary dark:text-text-secondary-dark">{fmtDateShort(m.joinDate)}</td>
                  <td className="p-3 text-text-secondary dark:text-text-secondary-dark">{m.duration || '—'}</td>
                  <td className="p-3 text-text-secondary dark:text-text-secondary-dark">{fmtDateShort(m.expiry)}</td>
                  <td className="p-3">
                    {m.vacant ? (
                      <Link href="/add" className="text-blue-accent text-xs font-medium cursor-pointer hover:underline">+ Add</Link>
                    ) : (
                      <Badge status={status} size="sm" />
                    )}
                  </td>
                  <td className="p-3 relative">
                    {!m.vacant && (
                      <>
                        <button
                          onClick={() => setOpenActions(openActions === m.seat ? null : m.seat)}
                          className="cursor-pointer p-1 rounded hover:bg-bg dark:hover:bg-bg-dark transition-colors"
                          aria-label={`Actions for ${m.name}`}
                        >
                          <MoreVertical className="w-4 h-4 text-text-tertiary dark:text-text-tertiary-dark" />
                        </button>
                        <AnimatePresence>
                          {openActions === m.seat && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 top-full z-10 w-48 rounded-lg border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark shadow-lg"
                            >
                              <button
                                onClick={() => { if (m.fee === 'due') { onMarkPaid(m.seat); } else { onMarkDue(m.seat); } setOpenActions(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary dark:text-text-primary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                                {m.fee === 'due' ? 'Mark fee paid' : 'Mark fee due'}
                              </button>
                              <button
                                onClick={() => { onRenew(m.seat); setOpenActions(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary dark:text-text-primary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors cursor-pointer"
                              >
                                <RefreshCw className="w-4 h-4" />
                                Renew membership
                              </button>
                              {m.phone && (
                                <a
                                  href={`https://wa.me/${m.phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary dark:text-text-primary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors cursor-pointer"
                                  onClick={() => setOpenActions(null)}
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  WhatsApp
                                </a>
                              )}
                              <button
                                onClick={() => { onRemove(m.seat); setOpenActions(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-expired-text dark:text-expired-text-dark hover:bg-expired-fill dark:hover:bg-expired-fill-dark transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove member
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </td>
                </motion.tr>
              );
            })}
            </AnimatePresence>
          </motion.tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <motion.div 
        layout
        className="md:hidden space-y-2"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map(m => {
            const status = getSeatStatus(m);
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                key={m.seat}
                className={cn(
                  'rounded-xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark p-3.5 transition-colors',
                  selected.has(m.seat) && 'ring-2 ring-blue-accent/30',
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {!m.vacant && (
                      <input
                        type="checkbox"
                        checked={selected.has(m.seat)}
                        onChange={() => toggleSelect(m.seat)}
                        className="w-4 h-4 mt-0.5 rounded cursor-pointer accent-blue-accent"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-text-tertiary dark:text-text-tertiary-dark">
                          #{String(m.seat).padStart(2, '0')}
                        </span>
                        <span className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                          {m.vacant ? 'Vacant' : m.name}
                        </span>
                      </div>
                      {!m.vacant && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge status={status} size="sm" />
                          {m.expiry && (
                            <span className="text-[11px] text-text-tertiary dark:text-text-tertiary-dark">
                              Expires: {fmtDateShort(m.expiry)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {m.vacant ? (
                    <Link
                      href="/add"
                      className="flex items-center gap-1 text-xs font-medium text-blue-accent cursor-pointer hover:underline"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add
                    </Link>
                  ) : (
                    <button
                      onClick={() => setOpenActions(openActions === m.seat ? null : m.seat)}
                      className="cursor-pointer p-1 rounded hover:bg-bg dark:hover:bg-bg-dark transition-colors"
                      aria-label={`Actions for ${m.name}`}
                    >
                      <MoreVertical className="w-4 h-4 text-text-tertiary dark:text-text-tertiary-dark" />
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {openActions === m.seat && !m.vacant && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 pt-2 border-t border-card-border dark:border-card-border-dark flex flex-wrap gap-2 overflow-hidden"
                    >
                      <button
                        onClick={() => { if (m.fee === 'due') { onMarkPaid(m.seat); } else { onMarkDue(m.seat); } setOpenActions(null); }}
                        className="cursor-pointer text-xs font-medium px-2.5 py-1.5 rounded-md bg-active-fill dark:bg-active-fill-dark text-active-text dark:text-active-text-dark"
                      >
                        {m.fee === 'due' ? 'Mark Paid' : 'Mark Due'}
                      </button>
                      <button
                        onClick={() => { onRenew(m.seat); setOpenActions(null); }}
                        className="cursor-pointer text-xs font-medium px-2.5 py-1.5 rounded-md bg-blue-accent/10 text-blue-accent"
                      >
                        Renew
                      </button>
                      <button
                        onClick={() => { onRemove(m.seat); setOpenActions(null); }}
                        className="cursor-pointer text-xs font-medium px-2.5 py-1.5 rounded-md text-expired-text dark:text-expired-text-dark bg-expired-fill dark:bg-expired-fill-dark"
                      >
                        Remove
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-text-tertiary dark:text-text-tertiary-dark">
          <p className="text-sm">No members found</p>
        </div>
      )}
    </div>
  );
}
