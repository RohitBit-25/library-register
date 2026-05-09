'use client';

import { useState, useMemo } from 'react';
import { type Member, type Duration, type SeatStatus } from '@/lib/types';
import { getSeatStatus, fmtDate, durationLabel, shiftLabel, calcExpiry, todayISO, cn, daysUntilExpiry } from '@/lib/utils';
import BottomSheet from '@/components/ui/BottomSheet';
import Modal from '@/components/ui/Modal';
import { Phone, Calendar, Clock, Sun, Moon, Zap, X, RefreshCw, Trash2, CreditCard, MessageCircle, Copy, Pencil, Save, XCircle } from 'lucide-react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';

const renewSchema = z.object({
  renewDate: z.string().min(1, 'Required'),
  renewDuration: z.enum(['1M', '3M', '6M', '1Y']),
});
type RenewFormValues = z.infer<typeof renewSchema>;

const editSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Valid phone required'),
  shift: z.enum(['morning', 'evening', 'full']),
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

// ── Status gradient banner config ──────────────────
const statusGradient: Record<SeatStatus, string> = {
  active: 'bg-emerald-500 text-[var(--saffron-50)] shadow-lg shadow-emerald-500/20',
  expiring: 'bg-amber-500 text-[var(--saffron-50)] shadow-lg shadow-amber-500/20',
  expired: 'bg-ruby-500 text-[var(--saffron-50)] shadow-lg shadow-ruby-500/20',
  due: 'bg-saffron-500 text-[var(--saffron-50)] shadow-lg shadow-saffron-500/20',
  vacant: 'bg-[var(--bg-surface)] border-2 border-dashed border-[var(--border-default)] text-[var(--text-primary)] opacity-90',
};

const statusLabel: Record<SeatStatus, string> = {
  active: 'Active Member',
  expiring: 'Expiring Soon',
  expired: 'Membership Expired',
  due: 'Fee Pending',
  vacant: 'Vacant Seat',
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

  // Renew form
  const { register: renewRegister, handleSubmit: handleRenewSubmit, control: renewControl, reset: renewReset } = useForm<RenewFormValues>({
    resolver: zodResolver(renewSchema),
    defaultValues: { renewDate: todayISO(), renewDuration: '3M' },
  });
  const watchDate = useWatch({ control: renewControl, name: 'renewDate' });
  const watchDuration = useWatch({ control: renewControl, name: 'renewDuration' });

  // Edit form
  const { register: editRegister, handleSubmit: handleEditSubmit, control: editControl, reset: editReset } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: member?.name || '',
      phone: member?.phone || '',
      shift: (member?.shift as 'morning' | 'evening' | 'full') || 'morning',
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

  const shiftIcon = member.shift === 'evening' ? (
    <Moon className="w-4 h-4" />
  ) : member.shift === 'full' ? (
    <Zap className="w-4 h-4" />
  ) : (
    <Sun className="w-4 h-4" />
  );

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
      shift: (member.shift as 'morning' | 'evening' | 'full') || 'morning',
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
      phone: data.phone.trim(),
      shift: data.shift,
      joinDate: data.joinDate,
      duration: data.duration,
      expiry,
      fee: data.fee,
    });
    setEditMode(false);
  };

  const content = (
    <LazyMotion features={domAnimation}>
      <div className="space-y-4">
        {editMode ? (
          /* ── EDIT MODE ── */
          <m.form
            onSubmit={handleEditSubmit(handleSaveEdit)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="bg-[var(--indigo-500)] rounded-xl p-4 text-[var(--saffron-50)] shadow-lg shadow-[var(--indigo-500)]/20">
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Editing</p>
              <h4 className="text-lg font-black mt-1 tracking-tight">
                Seat {member.seat} — {member.name.split(' ')[0]}
              </h4>
            </div>

            <div className="space-y-4 pt-2">
              <FloatingLabelInput label="Full Name" {...editRegister('name')} />
              <FloatingLabelInput label="WhatsApp Number" type="tel" inputMode="tel" {...editRegister('phone')} />

              <div>
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Shift</span>
                <Controller
                  name="shift"
                  control={editControl}
                  render={({ field }) => (
                    <div className="flex gap-1.5 mt-1.5 bg-[var(--bg-base)] p-1.5 rounded-xl border border-[var(--border-default)] shadow-inner shadow-black/5">
                      {(['morning', 'evening', 'full'] as const).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => field.onChange(s)}
                          className={cn(
                            'flex-1 py-3 rounded-lg text-[13px] font-bold transition-all duration-300 cursor-pointer',
                            field.value === s
                              ? 'bg-[var(--saffron-500)] text-white shadow-md ring-1 ring-[var(--saffron-500)]/50 z-10'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass)] scale-[0.98] hover:scale-100',
                          )}
                        >
                          {shiftLabel(s)}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              <FloatingLabelInput label="Date of Joining" type="date" {...editRegister('joinDate')} />

              <div>
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Duration</span>
                <Controller
                  name="duration"
                  control={editControl}
                  render={({ field }) => (
                    <div className="flex gap-1.5 mt-1.5 bg-[var(--bg-base)] p-1.5 rounded-xl border border-[var(--border-default)] shadow-inner shadow-black/5">
                      {(['1M', '3M', '6M', '1Y'] as Duration[]).map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => field.onChange(d)}
                          className={cn(
                            'flex-1 py-3 rounded-lg text-[13px] font-bold transition-all duration-300 cursor-pointer',
                            field.value === d
                              ? 'bg-[var(--saffron-500)] text-white shadow-md ring-1 ring-[var(--saffron-500)]/50 z-10'
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
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Fee Status</span>
                <Controller
                  name="fee"
                  control={editControl}
                  render={({ field }) => (
                    <div className="flex gap-1.5 mt-1.5 bg-[var(--bg-base)] p-1.5 rounded-xl border border-[var(--border-default)] shadow-inner shadow-black/5">
                      {(['paid', 'due'] as const).map(f => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => field.onChange(f)}
                          className={cn(
                            'flex-1 py-3 rounded-lg text-[13px] font-bold transition-all duration-300 cursor-pointer capitalize',
                            field.value === f
                              ? (f === 'paid' ? 'bg-emerald-500 text-[var(--saffron-50)] shadow-md' : 'bg-[var(--saffron-500)] text-[#1a1a16] shadow-md')
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
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 shadow-sm text-center border-dashed">
                  <span className="text-xs font-bold text-[var(--emerald-500)] uppercase tracking-wider">Calculated Expiry</span>
                  <p className="text-lg font-black text-[var(--emerald-500)] mt-1 flex justify-center items-center gap-2">
                    <Calendar className="w-4 h-4 opacity-70" />
                    {fmtDate(editExpiry)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-base)] hover:text-[var(--ruby-400)] transition-colors cursor-pointer active:scale-95 shadow-sm flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                className="flex-[1.5] py-3.5 rounded-xl text-xs font-black uppercase tracking-widest bg-[var(--indigo-500)] text-[var(--saffron-50)] hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-[var(--indigo-500)]/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </m.form>
        ) : !renewMode ? (
          <>
            {/* Status Banner */}
            <div className={cn('rounded-xl p-4 text-[var(--saffron-50)] relative overflow-hidden', statusGradient[status])}>
              <div className="absolute top-0 right-0 w-28 h-28 rounded-bl-[100px] bg-white/10 pointer-events-none" />
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                  {statusLabel[status]}
                </p>
                <h4 className="text-xl font-black mt-1 tracking-tight">
                  {member.vacant ? 'Available' : member.name}
                </h4>
                {!member.vacant && (
                  <div className="flex items-center gap-3 mt-2 text-sm font-semibold opacity-90">
                    <span className="flex items-center gap-1 bg-white/20 rounded-md px-2 py-0.5 text-xs">
                      {shiftIcon}
                      {shiftLabel(member.shift)}
                    </span>
                    {days !== Infinity && (
                      <span className="text-xs bg-white/20 rounded-md px-2 py-0.5">
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
                <div className="space-y-1 bg-[var(--bg-base)] rounded-xl p-3">
                  {readonly ? (
                    <>
                      <InfoRow icon={<Calendar className="w-4 h-4 text-sapphire-500" />} label="Status" value="Occupied" />
                      <div className="px-1 py-3 text-center">
                        <p className="text-xs text-[var(--text-tertiary)]">Contact the librarian to manage this seat.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <InfoRow 
                        icon={<Phone className="w-4 h-4 text-sapphire-500" />} 
                        label="Phone" 
                        value={member.phone || '—'}
                        action={member.phone ? (
                          <button onClick={handleCopyPhone} className="text-[var(--text-tertiary)] hover:text-sapphire-500 transition-colors cursor-pointer p-1">
                            {copied ? <span className="text-[10px] font-bold text-emerald-500">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        ) : undefined}
                      />
                      <InfoRow icon={<Calendar className="w-4 h-4 text-sapphire-500" />} label="Joined" value={fmtDate(member.joinDate)} />
                      <InfoRow icon={<Clock className="w-4 h-4 text-sapphire-500" />} label="Duration" value={durationLabel(member.duration as Duration)} />
                      <InfoRow icon={<Calendar className="w-4 h-4 text-sapphire-500" />} label="Expires" value={fmtDate(member.expiry)} />
                    </>
                  )}
                </div>

                {/* Actions — admin only */}
                {!readonly && (
                <div className="space-y-2">
                  {/* Edit button */}
                  {onUpdate && (
                    <button
                      onClick={openEditMode}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-[var(--indigo-500)] bg-[var(--indigo-500)]/10 border border-[var(--indigo-500)]/20 hover:bg-[var(--indigo-500)]/20 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit Details
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {member.fee === 'due' ? (
                      <ActionBtn 
                        onClick={() => { onMarkPaid(member.seat); onClose(); }} 
                        icon={<CreditCard className="w-4 h-4" />}
                        className="bg-emerald-500 text-[var(--saffron-50)] shadow-sm hover:shadow-md hover:bg-emerald-600 border-transparent"
                      >
                        Mark Paid
                      </ActionBtn>
                    ) : (
                      <ActionBtn 
                        onClick={() => { onMarkDue(member.seat); onClose(); }} 
                        icon={<CreditCard className="w-4 h-4" />}
                        className="bg-[var(--saffron-500)]/10 text-[var(--saffron-500)] border border-[var(--saffron-500)]/30 hover:bg-[var(--saffron-500)]/15"
                      >
                        Mark Due
                      </ActionBtn>
                    )}
                    <ActionBtn 
                      onClick={() => { renewReset({ renewDate: todayISO(), renewDuration: '3M' }); setRenewMode(true); }} 
                      icon={<RefreshCw className="w-4 h-4" />}
                      className="bg-sapphire-500 text-[var(--saffron-50)] shadow-sm hover:shadow-md hover:bg-sapphire-600 border-transparent"
                    >
                      Renew
                    </ActionBtn>
                  </div>

                  {member.phone && (
                    <a
                      href={`https://wa.me/${member.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hi ' + member.name.split(' ')[0] + ', your library membership for Seat ' + member.seat + ' needs attention.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp Message
                    </a>
                  )}

                  <button
                    onClick={() => setConfirmRemove(true)}
                    className="w-full flex items-center justify-center gap-2 text-center text-sm font-bold text-[var(--ruby-500)] py-2.5 rounded-xl border border-[var(--ruby-500)]/20 hover:bg-[var(--ruby-500)]/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Member
                  </button>
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
            <div className="bg-sapphire-500 rounded-xl p-4 text-[var(--saffron-50)] shadow-lg shadow-sapphire-500/20">
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Renewal</p>
              <h4 className="text-lg font-black mt-1 tracking-tight">
                Seat {member.seat} — {member.name.split(' ')[0]}
              </h4>
            </div>

            <div className="space-y-4 pt-2">
              <FloatingLabelInput
                label="New join date"
                type="date"
                {...renewRegister('renewDate')}
              />

              <div>
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Duration</span>
                <Controller
                  name="renewDuration"
                  control={renewControl}
                  render={({ field }) => (
                    <div className="flex gap-1.5 mt-1.5 bg-[var(--bg-base)] p-1.5 rounded-xl border border-[var(--border-default)] shadow-inner shadow-black/5">
                      {(['1M', '3M', '6M', '1Y'] as Duration[]).map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => field.onChange(d)}
                          className={cn(
                            'flex-1 py-3 rounded-lg text-[13px] font-bold transition-all duration-300 cursor-pointer relative overflow-hidden',
                            field.value === d
                              ? 'bg-sapphire-500 text-[var(--saffron-50)] shadow-md scale-100 ring-1 ring-sapphire-500/50 z-10'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] scale-[0.98] hover:scale-100 z-0',
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 shadow-sm text-center border-dashed">
                <span className="text-xs font-bold text-[var(--emerald-500)] uppercase tracking-wider">New expiry date</span>
                <p className="text-lg font-black text-[var(--emerald-500)] mt-1 flex justify-center items-center gap-2">
                  <Calendar className="w-4 h-4 opacity-70" />
                  {renewExpiry ? fmtDate(renewExpiry) : '—'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setRenewMode(false)}
                className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-base)] hover:text-[var(--ruby-400)] transition-colors cursor-pointer active:scale-95 shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-[1.5] py-3.5 rounded-xl text-xs font-black uppercase tracking-widest bg-sapphire-500 text-[var(--saffron-50)] hover:bg-sapphire-600 transition-all cursor-pointer shadow-lg shadow-sapphire-500/20 hover:shadow-xl hover:shadow-sapphire-500/30 active:scale-95"
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
        title={`Seat ${String(member.seat).padStart(2, '0')}`}
        snapPoint="60%"
      >
        {content}
      </BottomSheet>
    );
  }

  // Desktop: fill container (parent defines positioning)
  return (
    <div className="h-full flex flex-col bg-transparent text-[var(--text-primary)]">
      <div className="flex items-center justify-between p-5 sm:px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/50 backdrop-blur-md sticky top-0 z-10">
        <h3 className="text-base font-black text-[var(--text-primary)] font-mono flex items-center gap-2">
          <span className="w-8 h-8 bg-gradient-to-br from-sapphire-500 to-sapphire-600 rounded-lg flex items-center justify-center text-[var(--saffron-50)] text-xs font-black shadow-sm">
            {String(member.seat).padStart(2, '0')}
          </span>
          Seat Details
        </h3>
        <button 
          onClick={() => { setRenewMode(false); setEditMode(false); onClose(); }}
          className="cursor-pointer rounded-xl p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-all hover:rotate-90 duration-200"
          aria-label="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 pb-8 custom-scrollbar">
        {content}
      </div>
    </div>
  );
}

// ─── Helper components ──────────────────────────────────────────

function InfoRow({ icon, label, value, action }: { icon: React.ReactNode; label: string; value: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2 px-1">
      <span className="shrink-0">{icon}</span>
      <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider w-16 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-[var(--text-primary)] flex-1">{value}</span>
      {action}
    </div>
  );
}

function ActionBtn({ onClick, icon, className, children }: { onClick: () => void; icon: React.ReactNode; className: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer active:scale-95',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}
