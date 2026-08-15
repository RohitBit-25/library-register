'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { fmtDate } from '@/lib/utils';
import { Users, ShieldCheck, UserPlus, Ban, RotateCcw, KeyRound } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

interface StaffRow {
  id: string;
  name: string;
  role: 'owner' | 'staff';
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  lockedUntil: string | null;
}

const fetcher = async (url: string): Promise<StaffRow[]> => {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
};

export default function StaffPage() {
  const { staffName, isOwner } = useAuth();
  const { addToast } = useToast();
  const { data: staff = [], mutate, isLoading } = useSWR<StaffRow[]>('/api/staff', fetcher);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<'owner' | 'staff'>('staff');
  const [busy, setBusy] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<StaffRow | null>(null);

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, pin, role }),
      credentials: 'same-origin',
    });
    setBusy(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return addToast('error', body.error ?? 'Could not add staff.');
    addToast('success', `${name} can now sign in`);
    setName(''); setPin(''); setRole('staff'); setAdding(false);
    mutate();
  };

  const setActive = async (row: StaffRow, active: boolean) => {
    const res = await fetch('/api/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, active }),
      credentials: 'same-origin',
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return addToast('error', body.error ?? 'Could not update access.');
    addToast(active ? 'success' : 'warning',
      active ? `${row.name} can sign in again` : `${row.name} can no longer sign in`);
    setConfirmRevoke(null);
    mutate();
  };

  return (
    <div className="animate-fade-in max-w-3xl pb-24">
      <PageHeader
        title="Staff"
        icon={<Users className="h-5 w-5" />}
        subtitle={
          <>
            Each person signs in with their own PIN, so the activity log records who did what.
            {staffName && <> You are signed in as <strong className="text-[var(--text-primary)]">{staffName}</strong>.</>}
          </>
        }
      />

      {isOwner && (
        <div className="mb-5">
          {adding ? (
            <Card variant="base" className="p-5">
              <form onSubmit={addStaff} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Name</span>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required minLength={2} maxLength={40}
                      className="h-11 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-base)] px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--saffron-600)]"
                      placeholder="e.g. Priya"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">PIN (4–8 digits)</span>
                    <input
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      required inputMode="numeric" autoComplete="off"
                      className="h-11 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-base)] px-3 font-mono tracking-[0.3em] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--saffron-600)]"
                      placeholder="••••"
                    />
                  </label>
                </div>

                <fieldset>
                  <legend className="mb-1.5 text-sm font-medium text-[var(--text-secondary)]">Role</legend>
                  <div className="flex gap-2">
                    {(['staff', 'owner'] as const).map(r => (
                      <button
                        key={r} type="button" onClick={() => setRole(r)}
                        aria-pressed={role === r}
                        className={`min-h-[40px] flex-1 cursor-pointer rounded-xl border px-3 text-sm font-semibold transition-ui ${
                          role === r
                            ? 'border-[var(--saffron-600)] bg-[var(--saffron-50)] text-[var(--saffron-700)]'
                            : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]'
                        }`}
                      >
                        {r === 'staff' ? 'Staff — day to day' : 'Owner — can manage staff'}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit" disabled={busy || pin.length < 4 || name.trim().length < 2}
                    className="min-h-[44px] flex-1 cursor-pointer rounded-xl bg-[var(--saffron-600)] text-sm font-semibold text-[var(--text-inverse)] transition-ui hover:bg-[var(--saffron-700)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? 'Adding…' : 'Add staff member'}
                  </button>
                  <button
                    type="button" onClick={() => setAdding(false)}
                    className="min-h-[44px] cursor-pointer rounded-xl border border-[var(--border-default)] px-5 text-sm font-medium text-[var(--text-secondary)] transition-ui hover:bg-[var(--bg-muted)]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Card>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-[var(--saffron-700)] bg-[var(--saffron-600)] px-5 text-sm font-semibold text-[var(--text-inverse)] transition-ui hover:bg-[var(--saffron-700)]"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Add staff member
            </button>
          )}
        </div>
      )}

      <Card variant="base" className="overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-[var(--text-tertiary)]">Loading…</p>
        ) : (
          <ul className="divide-y divide-[var(--border-subtle)]">
            {staff.map(s => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  s.role === 'owner'
                    ? 'bg-[var(--saffron-50)] text-[var(--saffron-700)]'
                    : 'bg-[var(--bg-muted)] text-[var(--text-secondary)]'
                }`}>
                  {s.role === 'owner'
                    ? <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    : <KeyRound className="h-4 w-4" aria-hidden="true" />}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                    {s.name}
                    {s.name === staffName && (
                      <span className="rounded-md bg-[var(--sapphire-50)] px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[var(--sapphire-600)]">
                        You
                      </span>
                    )}
                    {!s.active && (
                      <span className="rounded-md bg-[var(--bg-muted)] px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Revoked
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                    {s.role === 'owner' ? 'Owner' : 'Staff'} ·{' '}
                    {s.lastLoginAt ? `last signed in ${fmtDate(s.lastLoginAt.slice(0, 10))}` : 'never signed in'}
                  </p>
                </div>

                {isOwner && s.name !== staffName && (
                  s.active ? (
                    <button
                      onClick={() => setConfirmRevoke(s)}
                      className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--ruby-200)] bg-[var(--ruby-50)] px-2.5 text-xs font-bold text-[var(--ruby-600)] transition-ui hover:bg-[var(--ruby-100)]"
                    >
                      <Ban className="h-4 w-4" aria-hidden="true" />
                      Revoke
                    </button>
                  ) : (
                    <button
                      onClick={() => setActive(s, true)}
                      className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--emerald-200)] bg-[var(--emerald-50)] px-2.5 text-xs font-bold text-[var(--emerald-600)] transition-ui hover:bg-[var(--emerald-100)]"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      Restore
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {!isOwner && (
        <p className="mt-3 text-xs text-[var(--text-tertiary)]">
          Only an owner can add or revoke staff.
        </p>
      )}

      <ConfirmDialog
        isOpen={confirmRevoke !== null}
        onClose={() => setConfirmRevoke(null)}
        onConfirm={() => confirmRevoke && setActive(confirmRevoke, false)}
        title={confirmRevoke ? `Revoke access for ${confirmRevoke.name}?` : ''}
        description={
          confirmRevoke
            ? `${confirmRevoke.name} will no longer be able to sign in. Their name stays on the activity log entries they already created, so the history stays readable. You can restore access at any time.`
            : ''
        }
        confirmText="Revoke access"
        variant="danger"
      />
    </div>
  );
}
