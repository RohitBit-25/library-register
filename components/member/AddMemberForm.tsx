'use client';

import { useState, useMemo } from 'react';
import { type Member, type Duration, type Shift, type FeeStatus } from '@/lib/types';
import { calcExpiry, todayISO, fmtDate, cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface AddMemberFormProps {
  nextVacantSeat: number;
  onSubmit: (data: Omit<Member, 'seat' | 'vacant'>) => void;
}

export default function AddMemberForm({ nextVacantSeat, onSubmit }: AddMemberFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [shift, setShift] = useState<Shift>('morning');
  const [joinDate, setJoinDate] = useState(todayISO());
  const [duration, setDuration] = useState<Duration>('3M');
  const [fee, setFee] = useState<FeeStatus>('paid');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const expiry = useMemo(() => calcExpiry(joinDate, duration), [joinDate, duration]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!joinDate) errs.joinDate = 'Join date is required';
    if (new Date(joinDate) > new Date()) errs.joinDate = 'Join date cannot be in the future';
    if (!duration) errs.duration = 'Select a duration';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nextVacantSeat === -1) return;
    if (!validate()) return;
    onSubmit({ name: name.trim(), phone, shift, joinDate, duration, expiry, fee });
    setName('');
    setPhone('');
    setShift('morning');
    setJoinDate(todayISO());
    setDuration('3M');
    setFee('paid');
    setErrors({});
  };

  const clearForm = () => {
    setName('');
    setPhone('');
    setShift('morning');
    setJoinDate(todayISO());
    setDuration('3M');
    setFee('paid');
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Auto allotment */}
      <div className="rounded-xl border-2 border-blue-accent/30 bg-blue-accent/5 dark:bg-blue-accent/10 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-4xl font-bold font-mono text-blue-accent">
              {nextVacantSeat === -1 ? '—' : nextVacantSeat}
            </p>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-1">
              {nextVacantSeat === -1 ? 'No vacant seats' : 'Next available seat'}
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-lg bg-blue-accent/10 px-3 py-1.5 text-xs font-semibold text-blue-accent">
            <Zap className="w-3.5 h-3.5" />
            AUTO
          </span>
        </div>
      </div>

      {/* Form fields */}
      <div className="rounded-xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark p-5 space-y-5">
        <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark uppercase tracking-wide">
          Member Details
        </h3>

        {/* Name */}
        <FieldGroup label="Full Name" required error={errors.name}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter full name"
            className={cn(
              'w-full rounded-lg border px-3 py-2.5 text-sm bg-input-bg dark:bg-input-bg-dark text-text-primary dark:text-text-primary-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary-dark focus:outline-none focus:ring-2 focus:ring-blue-accent/30',
              errors.name ? 'border-expired-border' : 'border-card-border dark:border-card-border-dark focus:border-blue-accent/50',
            )}
          />
        </FieldGroup>

        {/* Phone + Shift */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup label="Phone Number">
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="9XXXXXXXXX"
              className="w-full rounded-lg border border-card-border dark:border-card-border-dark px-3 py-2.5 text-sm bg-input-bg dark:bg-input-bg-dark text-text-primary dark:text-text-primary-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary-dark focus:outline-none focus:ring-2 focus:ring-blue-accent/30 focus:border-blue-accent/50"
            />
          </FieldGroup>

          <FieldGroup label="Shift">
            <SegmentedControl
              options={[
                { value: 'morning', label: '☀ Morning' },
                { value: 'evening', label: '☽ Evening' },
                { value: 'full', label: 'Full' },
              ]}
              value={shift}
              onChange={v => setShift(v as Shift)}
            />
          </FieldGroup>
        </div>

        {/* Join Date + Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup label="Join Date" required error={errors.joinDate}>
            <input
              type="date"
              value={joinDate}
              onChange={e => setJoinDate(e.target.value)}
              className={cn(
                'w-full rounded-lg border px-3 py-2.5 text-sm bg-input-bg dark:bg-input-bg-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-blue-accent/30',
                errors.joinDate ? 'border-expired-border' : 'border-card-border dark:border-card-border-dark focus:border-blue-accent/50',
              )}
            />
          </FieldGroup>

          <FieldGroup label="Membership Duration" required error={errors.duration}>
            <SegmentedControl
              options={[
                { value: '1M', label: '1M' },
                { value: '3M', label: '3M' },
                { value: '6M', label: '6M' },
                { value: '1Y', label: '1Y' },
              ]}
              value={duration}
              onChange={v => setDuration(v as Duration)}
            />
          </FieldGroup>
        </div>

        {/* Fee Status */}
        <FieldGroup label="Fee Status">
          <SegmentedControl
            options={[
              { value: 'paid', label: '✓ Paid' },
              { value: 'due', label: '⚠ Due' },
            ]}
            value={fee}
            onChange={v => setFee(v as FeeStatus)}
          />
        </FieldGroup>

        {/* Expiry preview */}
        <div className="rounded-lg bg-bg dark:bg-bg-dark p-3">
          <span className="text-xs text-text-tertiary dark:text-text-tertiary-dark">
            Expiry Date (auto-calculated)
          </span>
          <p className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mt-0.5 font-mono">
            {expiry ? fmtDate(expiry) : '—'}
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={nextVacantSeat === -1}
          className="flex-1 rounded-xl bg-blue-accent py-3 text-sm font-semibold text-white hover:bg-blue-accent/90 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          Register Member
        </button>
        <button
          type="button"
          onClick={clearForm}
          className="rounded-xl border border-card-border dark:border-card-border-dark px-5 py-3 text-sm font-medium text-text-secondary dark:text-text-secondary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors cursor-pointer"
        >
          Clear
        </button>
      </div>
    </form>
  );
}

// ─── Helper Components ──────────────────────────────────────────

function FieldGroup({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary dark:text-text-secondary-dark mb-1.5">
        {label}
        {required && <span className="text-expired-border ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-expired-text dark:text-expired-text-dark">{error}</p>
      )}
    </div>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border',
            value === opt.value
              ? 'bg-blue-accent text-white border-blue-accent shadow-sm'
              : 'bg-bg dark:bg-bg-dark border-card-border dark:border-card-border-dark text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
