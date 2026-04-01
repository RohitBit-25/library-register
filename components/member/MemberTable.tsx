'use client';

import { useState, useMemo, useEffect } from 'react';
import { type Member, type SeatStatus } from '@/lib/types';
import { getSeatStatus, fmtDateShort, firstName, cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import { Search, MoreVertical, Check, RefreshCw, MessageCircle, Trash2, UserPlus, ChevronUp, ChevronDown, Copy } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../ui/ConfirmDialog';
import Portal from '../ui/Portal';
import { Tooltip } from '../ui/Tooltip';
import { useToast } from '@/hooks/useToast';

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
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('seat');
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  
  // Action state
  const [openActions, setOpenActions] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [seatToRemove, setSeatToRemove] = useState<number | null>(null);
  const [bulkRemoveConfirm, setBulkRemoveConfirm] = useState(false);

  // Close dropdown on outside click or scroll
  useEffect(() => {
    const handleOutsideClick = () => setOpenActions(null);
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('scroll', handleOutsideClick, { passive: true });
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('scroll', handleOutsideClick);
    };
  }, []);

  const handleActionClick = (e: React.MouseEvent, seat: number) => {
    e.stopPropagation();
    if (openActions === seat) {
      setOpenActions(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY + 8,
      left: rect.right + window.scrollX - 192, // 192px is w-48
    });
    setOpenActions(seat);
  };

  const handleCopy = (e: React.MouseEvent, text: string, type: string) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    addToast('success', `Copied ${type}`);
  };

  // Filter & sort
  const filtered = useMemo(() => {
    let result = [...members];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) ||
        String(m.seat).includes(q) ||
        m.phone.includes(q)
      );
    }

    if (filter !== 'all') {
      if (filter === 'morning' || filter === 'evening') {
        result = result.filter(m => !m.vacant && (m.shift === filter || m.shift === 'full'));
      } else {
        result = result.filter(m => getSeatStatus(m) === filter);
      }
    }

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
      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={seatToRemove !== null}
        onClose={() => setSeatToRemove(null)}
        onConfirm={() => {
          if (seatToRemove !== null) onRemove(seatToRemove);
        }}
        title="Remove Member"
        description="Are you sure you want to remove this member? Their details and history will be cleared permanently."
        confirmText="Remove Member"
        variant="danger"
      />
      
      <ConfirmDialog
        isOpen={bulkRemoveConfirm}
        onClose={() => setBulkRemoveConfirm(false)}
        onConfirm={() => {
          onBulkRemove(Array.from(selected));
          setSelected(new Set());
        }}
        title="Bulk Remove Members"
        description={`Are you sure you want to remove ${selected.size} members? This action cannot be undone.`}
        confirmText="Remove All Selected"
        variant="danger"
      />

      {/* Bulk action bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-blue-accent/10 border border-blue-accent/20 p-3 shadow-sm"
          >
            <span className="text-sm font-bold text-blue-accent drop-shadow-sm px-2">
              {selected.size} selected
            </span>
            <Tooltip content="Mark selected members as paid">
              <button
                onClick={() => { onBulkMarkPaid(Array.from(selected)); setSelected(new Set()); }}
                className="cursor-pointer rounded-lg bg-green-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-green-600 transition-colors shadow-sm"
              >
                Mark Paid
              </button>
            </Tooltip>
            <Tooltip content="Remove selected members from system">
              <button
                onClick={() => setBulkRemoveConfirm(true)}
                className="cursor-pointer rounded-lg bg-red-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-600 transition-colors shadow-sm"
              >
                Remove
              </button>
            </Tooltip>
            <Tooltip content="Send payment reminders via WhatsApp">
              <button
                onClick={() => onBulkWhatsApp(Array.from(selected))}
                className="cursor-pointer rounded-lg bg-[#25D366] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#20bd5a] transition-colors shadow-sm"
              >
                WhatsApp
              </button>
            </Tooltip>
            <Tooltip content="Download member data as CSV">
              <button
                onClick={() => onBulkExport(Array.from(selected))}
                className="cursor-pointer rounded-lg bg-active-fill dark:bg-active-fill-dark px-3.5 py-2 text-xs font-bold text-active-text dark:text-active-text-dark hover:opacity-80 transition-opacity"
              >
                Export CSV
              </button>
            </Tooltip>
            <button
              onClick={() => setSelected(new Set())}
              className="cursor-pointer text-xs font-semibold text-text-secondary dark:text-text-secondary-dark ml-auto hover:text-text-primary dark:hover:text-text-primary-dark mr-2"
            >
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary dark:text-text-tertiary-dark" />
        <input
          type="search"
          placeholder="Search name, phone, seat... (Press / to focus)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-card-border dark:border-card-border-dark bg-input-bg dark:bg-input-bg-dark pl-9 pr-4 py-3 text-sm font-medium text-text-primary dark:text-text-primary-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary-dark focus:outline-none focus:ring-2 focus:ring-blue-accent/30 focus:border-blue-accent/50 transition-all shadow-sm"
        />
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1 custom-scrollbar">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
               'shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer border shadow-sm',
              filter === f.value
                ? 'bg-blue-accent text-white border-blue-accent'
                : 'bg-surface dark:bg-surface-dark border-card-border dark:border-card-border-dark text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark hover:border-text-tertiary',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-card-border dark:border-card-border-dark shadow-sm bg-surface dark:bg-surface-dark relative">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 backdrop-blur-xl bg-surface/90 dark:bg-surface-dark/90 border-b border-card-border dark:border-card-border-dark">
            <tr>
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  checked={selected.size === filtered.filter(m => !m.vacant).length && selected.size > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded cursor-pointer accent-blue-accent"
                />
              </th>
              <th className="text-left p-3 font-bold cursor-pointer select-none hover:text-blue-accent transition-colors" onClick={() => toggleSort('seat')}>
                <span className="flex items-center gap-1">Seat <SortIcon field="seat" currentField={sortField} asc={sortAsc} /></span>
              </th>
              <th className="text-left p-3 font-bold cursor-pointer select-none hover:text-blue-accent transition-colors" onClick={() => toggleSort('name')}>
                <span className="flex items-center gap-1">Name <SortIcon field="name" currentField={sortField} asc={sortAsc} /></span>
              </th>
              <th className="text-left p-3 font-bold">Phone</th>
              <th className="text-left p-3 font-bold cursor-pointer select-none hover:text-blue-accent transition-colors" onClick={() => toggleSort('joinDate')}>
                <span className="flex items-center gap-1">Joined <SortIcon field="joinDate" currentField={sortField} asc={sortAsc} /></span>
              </th>
              <th className="text-left p-3 font-bold">Dur.</th>
              <th className="text-left p-3 font-bold cursor-pointer select-none hover:text-blue-accent transition-colors" onClick={() => toggleSort('expiry')}>
                <span className="flex items-center gap-1">Expiry <SortIcon field="expiry" currentField={sortField} asc={sortAsc} /></span>
              </th>
              <th className="text-left p-3 font-bold">Status</th>
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
                  <td className="p-3 font-mono font-bold text-text-primary dark:text-text-primary-dark">
                    <div className="flex items-center gap-2 group">
                      {m.seat}
                      <button onClick={(e) => handleCopy(e, String(m.seat), 'seat')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Copy className="w-3 h-3 text-text-tertiary hover:text-blue-accent cursor-pointer" />
                      </button>
                    </div>
                  </td>
                  <td className="p-3 font-bold text-text-primary dark:text-text-primary-dark">
                    {m.vacant ? (
                      <span className="text-text-tertiary dark:text-text-tertiary-dark italic font-medium">(Vacant)</span>
                    ) : m.name}
                  </td>
                  <td className="p-3 text-text-secondary dark:text-text-secondary-dark font-medium">
                    {m.phone ? (
                      <div className="flex items-center gap-2 group">
                        {m.phone}
                        <button onClick={(e) => handleCopy(e, m.phone, 'phone number')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Copy className="w-3 h-3 text-text-tertiary hover:text-blue-accent cursor-pointer" />
                        </button>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="p-3 text-text-secondary dark:text-text-secondary-dark font-medium">{fmtDateShort(m.joinDate)}</td>
                  <td className="p-3 text-text-secondary dark:text-text-secondary-dark font-medium">{m.duration || '—'}</td>
                  <td className="p-3 text-text-secondary dark:text-text-secondary-dark font-medium">{fmtDateShort(m.expiry)}</td>
                  <td className="p-3">
                    {m.vacant ? (
                      <Link href="/add" className="text-blue-accent text-xs font-bold cursor-pointer hover:underline bg-blue-accent/10 py-1 px-3 rounded-md">+ Add</Link>
                    ) : (
                      <Badge status={status} size="sm" />
                    )}
                  </td>
                  <td className="p-3 relative">
                    {!m.vacant && (
                    <Tooltip content={`Manage ${m.name}`} side="left">
                      <button
                        onClick={(e) => handleActionClick(e, m.seat)}
                        className="cursor-pointer p-1.5 rounded-lg hover:bg-bg dark:hover:bg-bg-dark transition-colors"
                        aria-label={`Actions for ${m.name}`}
                      >
                        <MoreVertical className="w-4 h-4 text-text-tertiary dark:text-text-tertiary-dark" />
                      </button>
                    </Tooltip>
                    )}
                  </td>
                </motion.tr>
              );
            })}
            </AnimatePresence>
          </motion.tbody>
        </table>
      </div>

      {/* Desktop Portal Action Dropdown */}
      <Portal>
        <AnimatePresence>
          {openActions !== null && (
            <motion.div 
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-48 rounded-xl border border-card-border dark:border-card-border-dark bg-surface/95 dark:bg-surface-dark/95 backdrop-blur-xl shadow-2xl p-1"
            >
              {members.filter(m => m.seat === openActions).map(m => (
                <div key={m.seat}>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (m.fee === 'due') { onMarkPaid(m.seat); } else { onMarkDue(m.seat); } setOpenActions(null); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-text-primary dark:text-text-primary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors cursor-pointer rounded-lg"
                  >
                    <Check className="w-4 h-4" />
                    {m.fee === 'due' ? 'Mark fee paid' : 'Mark fee due'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRenew(m.seat); setOpenActions(null); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-text-primary dark:text-text-primary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors cursor-pointer rounded-lg"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Renew membership
                  </button>
                  {m.phone && (
                    <a
                      href={`https://wa.me/${m.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hi ' + firstName(m.name) + ', your library fee for Seat ' + m.seat + ' is due.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-text-primary dark:text-text-primary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors cursor-pointer rounded-lg"
                      onClick={(e) => { e.stopPropagation(); setOpenActions(null); }}
                    >
                      <MessageCircle className="w-4 h-4 text-[#25D366]" />
                      WhatsApp
                    </a>
                  )}
                  <div className="h-px bg-card-border dark:bg-card-border-dark my-1 mx-2" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setSeatToRemove(m.seat); setOpenActions(null); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove member
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>

      {/* Mobile card list */}
      <motion.div 
        layout
        className="md:hidden space-y-3"
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
                  'rounded-2xl border transition-colors shadow-sm',
                  selected.has(m.seat) 
                    ? 'border-blue-accent/50 bg-blue-accent/5'
                    : 'border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark',
                )}
              >
                <div className="p-4 flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {!m.vacant && (
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={selected.has(m.seat)}
                          onChange={() => toggleSelect(m.seat)}
                          className="w-[18px] h-[18px] rounded cursor-pointer accent-blue-accent"
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-text-tertiary dark:text-text-tertiary-dark bg-bg dark:bg-bg-dark px-1.5 py-0.5 rounded">
                          #{String(m.seat).padStart(2, '0')}
                        </span>
                        <span className="text-base font-black text-text-primary dark:text-text-primary-dark tracking-tight">
                          {m.vacant ? 'Vacant' : m.name}
                        </span>
                      </div>
                      {!m.vacant && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge status={status} size="sm" />
                          {m.expiry && (
                            <span className="text-xs font-medium text-text-secondary dark:text-text-secondary-dark flex items-center gap-1">
                              EXP: {fmtDateShort(m.expiry)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {m.vacant ? (
                    <Link
                      href="/add"
                      className="flex items-center gap-1 text-xs font-bold text-white bg-blue-accent px-3 py-1.5 rounded-lg shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add
                    </Link>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActions(openActions === m.seat ? null : m.seat);
                      }}
                      className="cursor-pointer p-2 rounded-lg bg-bg dark:bg-bg-dark hover:bg-surface transition-colors"
                      aria-label={`Actions for ${m.name}`}
                    >
                      <MoreVertical className="w-5 h-5 text-text-secondary dark:text-text-secondary-dark" />
                    </button>
                  )}
                </div>
                
                {/* Mobile Accordion Actions */}
                <AnimatePresence>
                  {openActions === m.seat && !m.vacant && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-card-border/50 dark:border-card-border-dark/50 bg-bg/50 dark:bg-bg-dark/50 rounded-b-2xl overflow-hidden"
                    >
                      <div className="p-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => { if (m.fee === 'due') { onMarkPaid(m.seat); } else { onMarkDue(m.seat); } setOpenActions(null); }}
                          className="flex justify-center flex-col items-center gap-1 cursor-pointer font-bold px-3 py-3 rounded-xl bg-surface dark:bg-surface-dark border border-card-border dark:border-card-border-dark shadow-sm"
                        >
                          <Check className="w-4 h-4 text-blue-accent" />
                          <span className="text-[11px] mt-0.5">{m.fee === 'due' ? 'Mark Paid' : 'Mark Due'}</span>
                        </button>
                        <button
                          onClick={() => { onRenew(m.seat); setOpenActions(null); }}
                          className="flex justify-center flex-col items-center gap-1 cursor-pointer font-bold px-3 py-3 rounded-xl bg-surface dark:bg-surface-dark border border-card-border dark:border-card-border-dark shadow-sm"
                        >
                          <RefreshCw className="w-4 h-4 text-blue-accent" />
                          <span className="text-[11px] mt-0.5">Renew</span>
                        </button>
                        {m.phone && (
                          <a
                            href={`https://wa.me/${m.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hi ' + firstName(m.name) + ', your library fee for Seat ' + m.seat + ' is due.')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex justify-center flex-1 col-span-2 sm:col-span-1 items-center gap-2 cursor-pointer text-xs font-bold px-3 py-3 rounded-xl bg-[#25D366]/10 text-[#20bd5a] border border-[#25D366]/20 shadow-sm"
                            onClick={(e) => { e.stopPropagation(); setOpenActions(null); }}
                          >
                            <MessageCircle className="w-5 h-5" />
                            WhatsApp Message
                          </a>
                        )}
                        <button
                          onClick={() => { setSeatToRemove(m.seat); setOpenActions(null); }}
                          className="flex justify-center flex-1 col-span-2 sm:col-span-1 items-center gap-2 cursor-pointer text-xs font-bold px-3 py-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove Member
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 px-4 bg-surface dark:bg-surface-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-sm mt-4"
        >
          <div className="w-16 h-16 bg-bg dark:bg-bg-dark rounded-full flex items-center justify-center mx-auto mb-4 border border-card-border dark:border-card-border-dark">
            <Search className="w-6 h-6 text-text-tertiary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary dark:text-text-primary-dark mb-1">No members found</h3>
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark font-medium">Try adjusting your filters or search query.</p>
        </motion.div>
      )}
    </div>
  );
}
