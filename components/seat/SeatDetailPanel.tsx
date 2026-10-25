'use client';

import { STATUS_STYLE } from './statusStyle';
import { seatRow } from '@/lib/layoutConfig';

import { useState, useMemo } from 'react';
import { type Member, type Duration, type SeatStatus } from '@/lib/types';
import { getSeatStatus, fmtDate, durationLabel, calcExpiry, todayISO, renewalStartDate, cn, daysUntilExpiry } from '@/lib/utils';
import BottomSheet from '@/components/ui/BottomSheet';
import Modal from '@/components/ui/Modal';
import { Phone, Calendar, Clock, X, RefreshCw, Trash2, CreditCard, MessageCircle, Copy, Pencil, Save, XCircle } from 'lucide-react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
import { phoneInput } from '@/lib/schemas';

const renewSchema = z.object({
  renewDate: z.string().min(1, 'Required'),
  renewDuration: z.enum(['1M', '3M', '6M', '1Y']),
});
type RenewFormValues = z.infer<typeof renewSchema>;

const editSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: phoneInput,
  joinDate: z.string().min(1, 'Join date is required'),
  duration: z.enum(['1M', '3M', '6M', '1Y']),
  fee: z.enum(['paid', 'due']),
});
type EditFormValues = z.infer<typeof editSchema>;

interface SeatDetailPanelProps {
  member: Member | null;
  open: boolean;
  onClose: () => void;
  onMarkPaid: (seat: number) => void;
  onMarkDue: (seat: number) => void;
  onRenew: (seat: number, joinDate: string, duration: Duration) => void;
  onRemove: (seat: number) => void;
  onUpdate?: (seat: number, patch: Partial<Member>) => void;
  isMobile: boolean;
  readonly?: boolean;
}

// The status block uses the same tint as the seat's tile on the plan, so the
// panel and the seat you tapped are visibly the same thing. It used to be a
// solid saturated slab — the loudest object on the screen for a routine state.
const statusGradient: Record<SeatStatus, string> = Object.fromEntries(
  Object.entries(STATUS_STYLE).map(([k, v]) => [k, `border ${v.tint} ${v.border} ${v.text}`])
) as Record<SeatStatus, string>;

const statusLabel: Record<SeatStatus, string> = {
  active: 'Active',
  expiring: 'Expiring soon',
  expired: 'Membership expired',
  due: 'Fee due',
  vacant: 'Vacant seat',
};

export default function SeatDetailPanel({
  member,
  open,
  onClose,
  onMarkPaid,
  onMarkDue,
  onRenew,
  onRemove,
  onUpdate,
  isMobile,
  readonly = false,
}: SeatDetailPanelProps) {
  const [renewMode, setRenewMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [copied, setCopied] = useState(false);

  const { register: renewRegister, handleSubmit: handleRenewSubmit, control: renewControl, reset: renewReset, formState: { errors: renewErrors } } = useForm<RenewFormValues>({
    resolver: zodResolver(renewSchema),
    // Starts from the later of the current expiry and today, so renewing early
    // does not throw away days the member already paid for. Admin can override.
    defaultValues: { renewDate: renewalStartDate(member?.expiry ?? ''), renewDuration: '3M' },
  });
  const watchDate = useWatch({ control: renewControl, name: 'renewDate' });
  const watchDuration = useWatch({ control: renewControl, name: 'renewDuration' });

  // Edit form
  const { register: editRegister, handleSubmit: handleEditSubmit, control: editControl, reset: editReset, formState: { errors: editErrors } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: member?.name || '',
      phone: member?.phone || '',
      joinDate: member?.joinDate || todayISO(),
      duration: (member?.duration as '1M' | '3M' | '6M' | '1Y') || '3M',
      fee: (member?.fee as 'paid' | 'due') || 'paid',
    },
  });
  const editJoinDate = useWatch({ control: editControl, name: 'joinDate' });
  const editDuration = useWatch({ control: editControl, name: 'duration' });

  const editExpiry = useMemo(() => {
    try { return calcExpiry(editJoinDate, editDuration); } catch { return ''; }
  }, [editJoinDate, editDuration]);

  const renewExpiry = useMemo(() => {
    try { return calcExpiry(watchDate, watchDuration); } catch { return ''; }
  }, [watchDate, watchDuration]);

  if (!member) return null;

  const status = getSeatStatus(member);
  const days = !member.vacant ? daysUntilExpiry(member.expiry) : 0;



  const handleCopyPhone = () => {
    if (member.phone) {
      navigator.clipboard.writeText(member.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const openEditMode = () => {
    editReset({
      name: member.name || '',
      phone: member.phone || '',
      joinDate: member.joinDate || todayISO(),
      duration: (member.duration as '1M' | '3M' | '6M' | '1Y') || '3M',
      fee: (member.fee as 'paid' | 'due') || 'paid',
    });
    setEditMode(true);
  };

  const handleSaveEdit = (data: EditFormValues) => {
    if (!onUpdate) return;
    const expiry = calcExpiry(data.joinDate, data.duration);
    onUpdate(member.seat, {
      name: data.name.trim(),
      phone: data.phone.replace(/\D/g, ''),
      joinDate: data.joinDate,
      duration: data.duration,
      expiry,
      fee: data.fee,
    });
    setEditMode(false);
  };

  const content = (
    <LazyMotion features={domAnimation}>
      <div className="h-full overflow-y-auto custom-scrollbar px-1 pb-4 space-y-4">
        {editMode ? (
          /* ── EDIT MODE ── */
          <m.form
            onSubmit={handleEditSubmit(handleSaveEdit)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="bg-[var(--saffron-700)] rounded-xl p-4 text-[var(--saffron-50)] shadow-lg">
              <p className="text-xs font-bold opacity-80">Editing</p>
              <h4 className="text-lg font-semibold mt-1">
                Seat {member.seat} — {member.name.split(' ')[0]}
              </h4>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <FloatingLabelInput label="Full Name" {...editRegister('name')} />
                {editErrors.name && <span className="text-xs text-[var(--ruby-600)] block mt-1 ml-1">{editErrors.name.message}</span>}
              </div>
              <div>
                <FloatingLabelInput label="WhatsApp Number" type="tel" inputMode="tel" {...editRegister('phone')} />
                {editErrors.phone && <span className="text-xs text-[var(--ruby-600)] block mt-1 ml-1">{editErrors.phone.message}</span>}
              </div>
              <div>
                <FloatingLabelInput label="Date of Joining" type="date" {...editRegister('joinDate')} />
                {editErrors.joinDate && <span className="text-xs text-[var(--ruby-600)] block mt-1 ml-1">{editErrors.joinDate.message}</span>}
              </div>

              <div>
                <span className="text-xs font-bold text-[var(--text-secondary)] ml-1">Duration</span>
                <Controller
                  name="duration"
                  control={editControl}
                  render={({ field }) => (
                    <div role="radiogroup" aria-label="Duration" className="mt-1.5 grid grid-cols-4 gap-1.5">
                      {(['1M', '3M', '6M', '1Y'] as Duration[]).map(d => (
                        <button
                          key={d}
                          type="button"
                          role="radio"
                          aria-checked={field.value === d}
                          onClick={() => field.onChange(d)}
                          className={cn(
                            'flex-1 py-3 rounded-lg text-sm font-bold transition-ui duration-300 cursor-pointer',
                            field.value === d
                              ? 'bg-[var(--saffron-500)] text-[var(--text-inverse)] shadow-md ring-1 ring-[var(--saffron-500)]/50 z-10'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass)] scale-[0.98] hover:scale-100',
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              <div>
                <span className="text-xs font-bold text-[var(--text-secondary)] ml-1">Fee Status</span>
                <Controller
                  name="fee"
                  control={editControl}
                  render={({ field }) => (
                    <div role="radiogroup" aria-label="Fee Status" className="mt-1.5 grid grid-cols-4 gap-1.5">
                      {(['paid', 'due'] as const).map(f => (
                        <button
                          key={f}
                          type="button"
                          role="radio"
                          aria-checked={field.value === f}
                          onClick={() => field.onChange(f)}
                          className={cn(
                            'flex-1 py-3 rounded-lg text-sm font-bold transition-ui duration-300 cursor-pointer capitalize',
                            field.value === f
                              ? (f === 'paid' ? 'bg-[var(--emerald-600)] text-[var(--saffron-50)] shadow-md' : 'bg-[var(--saffron-500)] text-[var(--text-inverse)] shadow-md')
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass)] scale-[0.98] hover:scale-100',
                          )}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              {editExpiry && (
                <div className="rounded-xl bg-[var(--emerald-50)] border border-[var(--emerald-200)] p-4 shadow-sm text-center border-dashed">
                  <span className="text-xs font-bold text-[var(--emerald-600)]">Calculated Expiry</span>
                  <p className="text-lg font-semibold text-[var(--emerald-600)] mt-1 flex justify-center items-center gap-2">
                    <Calendar className="size-4 opacity-70" />
                    {fmtDate(editExpiry)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="flex-1 py-3.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-base)] hover:text-[var(--ruby-600)] transition-colors cursor-pointer active:scale-95 shadow-sm flex items-center justify-center gap-2"
              >
                <XCircle className="size-4" />
                Cancel
              </button>
              <button
                type="submit"
                className="flex-[1.5] min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--ink)] text-sm font-semibold bg-[var(--ink)] text-[var(--text-inverse)] hover:bg-[var(--ink-hover)] transition-ui cursor-pointer active:scale-[0.97] flex items-center justify-center gap-2"
              >
                <Save className="size-4" />
                Save Changes
              </button>
            </div>
          </m.form>
        ) : !renewMode ? (
          <>
            {/* Status Banner */}
            <div className={cn('rounded-[var(--radius-md)] p-4', statusGradient[status])}>
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className={cn('size-2 rounded-full', STATUS_STYLE[status].dot)} aria-hidden="true" />
                  {statusLabel[status]}
                </p>
                <h4 className="mt-1.5 font-display text-lg font-semibold leading-tight text-[var(--text-primary)]">
                  {member.vacant ? 'Available' : member.name}
                </h4>
                {!member.vacant && (
                  <div className="flex items-center gap-3 mt-2 text-sm font-semibold opacity-90">
                    {days !== Infinity && (
                      <span className="font-mono text-xs tabular">
                        {days > 0 ? `${days}d left` : `${Math.abs(days)}d overdue`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!member.vacant && (
              <>
                {/* Info rows */}
                <div className="divide-y divide-[var(--border-default)] rounded-[var(--radius-md)] border border-[var(--border-default)] px-3">
                  {readonly ? (
                    <>
                      <InfoRow icon={<Calendar className="size-4 text-[var(--text-tertiary)]" aria-hidden="true" />} label="Status" value="Occupied" />
                      <div className="px-1 py-3 text-center">
                        <p className="text-xs text-[var(--text-tertiary)]">Contact the librarian to manage this seat.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <InfoRow 
                        icon={<Phone className="size-4 text-[var(--text-tertiary)]" aria-hidden="true" />} 
                        label="Phone" 
                        value={member.phone || '—'}
                        action={member.phone ? (
                          <button onClick={handleCopyPhone} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer p-1">
                            {copied ? <span className="text-xs font-bold text-[var(--emerald-500)]">Copied!</span> : <Copy className="size-4" />}
                          </button>
                        ) : undefined}
                      />
                      <InfoRow icon={<Calendar className="size-4 text-[var(--text-tertiary)]" aria-hidden="true" />} label="Joined" value={fmtDate(member.joinDate)} />
                      <InfoRow icon={<Clock className="size-4 text-[var(--text-tertiary)]" aria-hidden="true" />} label="Duration" value={durationLabel(member.duration as Duration)} />
                      <InfoRow icon={<Calendar className="size-4 text-[var(--text-tertiary)]" aria-hidden="true" />} label="Expires" value={fmtDate(member.expiry)} />
                    </>
                  )}
                </div>

                {/* Actions — admin only */}
                {!readonly && (
                <div className="space-y-2">
                  {/*
                    One hierarchy, not five colours.

                    These five actions used to be lavender (Edit), blue
                    (Renew), peach (Mark due), WhatsApp green, and red
                    (Remove) — every one a different hue, so nothing read as
                    primary and the destructive action had no more weight
                    than changing a phone number. Two of the tints were also
                    ~10% alphas, which measure far below the 3:1 a control
                    boundary needs.

                    Renew is the job this panel exists for, so it is the only
                    filled button. Everything else is a quiet outline, and
                    Remove is separated below a rule because it is the one
                    that cannot be undone.
                  */}
                  <ActionBtn
                    onClick={() => { renewReset({ renewDate: renewalStartDate(member.expiry), renewDuration: '3M' }); setRenewMode(true); }}
                    icon={<RefreshCw className="size-4" />}
                    className="w-full border-[var(--ink)] bg-[var(--ink)] text-[var(--text-inverse)] hover:bg-[var(--ink-hover)]"
                  >
                    Renew membership
                  </ActionBtn>

                  <div className="grid grid-cols-2 gap-2">
                    {member.fee === 'due' ? (
                      <ActionBtn
                        onClick={() => { onMarkPaid(member.seat); onClose(); }}
                        icon={<CreditCard className="size-4" />}
                        className="border border-[var(--emerald-200)] bg-[var(--emerald-50)] text-[var(--emerald-700)] hover:bg-[var(--emerald-100)]"
                      >
                        Mark paid
                      </ActionBtn>
                    ) : (
                      <ActionBtn
                        onClick={() => { onMarkDue(member.seat); onClose(); }}
                        icon={<CreditCard className="size-4" />}
                        className="border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                      >
                        Mark due
                      </ActionBtn>
                    )}

                    {onUpdate && (
                      <button
                        onClick={openEditMode}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] py-2.5 text-sm font-bold text-[var(--text-secondary)] transition-ui hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] shadow-[var(--shadow-xs)]"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        Edit details
                      </button>
                    )}
                  </div>

                  {member.phone && (
                    <a
                      href={`https://wa.me/${member.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hi ' + member.name.split(' ')[0] + ', your library membership for Seat ' + member.seat + ' needs attention.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] py-2.5 text-sm font-bold text-[var(--text-secondary)] transition-ui hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] shadow-[var(--shadow-xs)]"
                    >
                      <MessageCircle className="size-4" aria-hidden="true" />
                      Send a WhatsApp reminder
                    </a>
                  )}

                  <div className="border-t border-[var(--border-subtle)] pt-2">
                    <button
                      onClick={() => setConfirmRemove(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--ruby-200)] py-2.5 text-center text-sm font-bold text-[var(--ruby-600)] transition-ui hover:bg-[var(--ruby-50)]"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Remove member
                    </button>
                  </div>
                </div>
                )}
              </>
            )}
          </>
        ) : (
          /* Renewal form */
          <m.form
            onSubmit={handleRenewSubmit((data) => {
              onRenew(member.seat, data.renewDate, data.renewDuration);
              setRenewMode(false);
              onClose();
            })}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="rounded-xl bg-[var(--saffron-700)] p-4 text-[var(--text-inverse)] shadow-sm">
              <p className="text-xs font-bold opacity-80">Renewal</p>
              <h4 className="text-lg font-semibold mt-1">
                Seat {member.seat} — {member.name.split(' ')[0]}
              </h4>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <FloatingLabelInput
                  label="New join date"
                  type="date"
                  {...renewRegister('renewDate')}
                />
                {renewErrors.renewDate && <span className="text-xs text-[var(--ruby-600)] block mt-1 ml-1">{renewErrors.renewDate.message}</span>}
              </div>

              <div>
                <span className="text-xs font-bold text-[var(--text-secondary)] ml-1">Duration</span>
                <Controller
                  name="renewDuration"
                  control={renewControl}
                  render={({ field }) => (
                    <div role="radiogroup" aria-label="Renewal Duration" className="mt-1.5 grid grid-cols-4 gap-1.5">
                      {(['1M', '3M', '6M', '1Y'] as Duration[]).map(d => (
                        <button
                          key={d}
                          type="button"
                          role="radio"
                          aria-checked={field.value === d}
                          onClick={() => field.onChange(d)}
                          className={cn(
                            'min-h-[44px] rounded-[var(--radius-sm)] border font-mono text-sm font-medium transition-ui cursor-pointer',
                            field.value === d
                              ? 'border-[var(--text-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)] ring-1 ring-[var(--text-primary)]'
                              : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              <div className="rounded-xl bg-[var(--emerald-50)] border border-[var(--emerald-200)] p-4 shadow-sm text-center border-dashed">
                <span className="text-xs font-bold text-[var(--emerald-600)]">New expiry date</span>
                <p className="text-lg font-semibold text-[var(--emerald-600)] mt-1 flex justify-center items-center gap-2">
                  <Calendar className="size-4 opacity-70" />
                  {renewExpiry ? fmtDate(renewExpiry) : '—'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setRenewMode(false)}
                className="flex-1 py-3.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-base)] hover:text-[var(--ruby-600)] transition-colors cursor-pointer active:scale-95 shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-[1.5] rounded-xl py-3.5 text-xs font-semibold bg-[var(--saffron-700)] text-[var(--text-inverse)] hover:bg-[var(--saffron-800)] transition-ui cursor-pointer shadow-lg hover:shadow-xl hover: active:scale-95"
              >
                Confirm Renewal
              </button>
            </div>
          </m.form>
        )}

        <Modal
          open={confirmRemove}
          onClose={() => setConfirmRemove(false)}
          title={`Remove member from Seat ${member.seat}?`}
          description={`This will free seat ${member.seat} for a new member. This action cannot be undone.`}
          confirmLabel="Remove"
          confirmVariant="danger"
          onConfirm={() => {
            onRemove(member.seat);
            setConfirmRemove(false);
            onClose();
          }}
        />
      </div>
    </LazyMotion>
  );

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onClose={() => { setRenewMode(false); setEditMode(false); onClose(); }}
        title={`Seat ${member.seat}`}
        snapPoint="60%"
      >
        {content}
      </BottomSheet>
    );
  }

  // Desktop: fill container (parent defines positioning)
  return (
    <div className="h-full flex flex-col bg-transparent text-[var(--text-primary)] min-h-0">
      <div className="flex items-center justify-between p-5 sm:px-6 border-b border-[var(--border-default)] bg-[var(--bg-surface)] sticky top-0 z-10 shrink-0">
        <h3 className="font-display text-lg font-semibold leading-none text-[var(--text-primary)]">
          Seat <span className="tabular">{member.seat}</span>
          <span className="ml-2 font-body text-xs font-normal text-[var(--text-tertiary)]">{seatRow(member.seat)}</span>
        </h3>
        <button 
          onClick={() => { setRenewMode(false); setEditMode(false); onClose(); }}
          className="cursor-pointer rounded-[var(--radius-sm)] p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-ui"
          aria-label="Close panel"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 pb-8 custom-scrollbar min-h-0">
        {content}
      </div>
    </div>
  );
}

// ─── Helper components ──────────────────────────────────────────

function InfoRow({ icon, label, value, action }: { icon: React.ReactNode; label: string; value: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-[44px] items-center gap-3 py-2">
      <span className="shrink-0">{icon}</span>
      <span className="w-16 shrink-0 text-xs text-[var(--text-tertiary)]">{label}</span>
      <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">{value}</span>
      {action}
    </div>
  );
}

function ActionBtn({ onClick, icon, className, children }: { onClick: () => void; icon: React.ReactNode; className: string; children: React.ReactNode }) {
  return (
    <m.button
      whileTap={{ transform: 'scale(0.97)' }}
      onClick={onClick}
      className={cn(
        'flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--radius-sm)] border text-sm font-semibold transition-colors cursor-pointer',
        className,
      )}
    >
      {icon}
      {children}
    </m.button>
  );
}
