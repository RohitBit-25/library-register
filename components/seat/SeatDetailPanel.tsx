'use client';

import { useState, useMemo } from 'react';
import { type Member, type Duration, type SeatStatus } from '@/lib/types';
import { getSeatStatus, fmtDate, durationLabel, shiftLabel, calcExpiry, todayISO, cn, daysUntilExpiry } from '@/lib/utils';
import BottomSheet from '@/components/ui/BottomSheet';
import Modal from '@/components/ui/Modal';
import { Phone, Calendar, Clock, Sun, Moon, Zap, X, RefreshCw, Trash2, CreditCard, MessageCircle, Copy } from 'lucide-react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';

const renewSchema = z.object({
  renewDate: z.string().min(1, 'Required'),
  renewDuration: z.enum(['1M', '3M', '6M', '1Y']),
});
type RenewFormValues = z.infer<typeof renewSchema>;

interface SeatDetailPanelProps {
  member: Member | null;
  open: boolean;
  onClose: () => void;
  onMarkPaid: (seat: number) => void;
  onMarkDue: (seat: number) => void;
  onRenew: (seat: number, joinDate: string, duration: Duration) => void;
  onRemove: (seat: number) => void;
  isMobile: boolean;
  readonly?: boolean;
}

// ── Status gradient banner config ──────────────────
const statusGradient: Record<SeatStatus, string> = {
  active: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
  expiring: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20',
  expired: 'bg-ruby-500 text-white shadow-lg shadow-ruby-500/20',
  due: 'bg-saffron-500 text-white shadow-lg shadow-saffron-500/20',
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
  isMobile,
  readonly = false,
}: SeatDetailPanelProps) {
  const [renewMode, setRenewMode] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, control, reset } = useForm<RenewFormValues>({
    resolver: zodResolver(renewSchema),
    defaultValues: {
      renewDate: todayISO(),
      renewDuration: '3M',
    },
  });

  const watchDate = useWatch({ control, name: 'renewDate' });
  const watchDuration = useWatch({ control, name: 'renewDuration' });
     
  // We can remove watch from useForm destructure if not needed anywhere else

  const renewExpiry = useMemo(() => {
    try {
      return calcExpiry(watchDate, watchDuration);
    } catch {
      return '';
    }
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

  const content = (
    <LazyMotion features={domAnimation}>
      <div className="space-y-4">
        {!renewMode ? (
          <>
            {/* Status Banner */}
            <div className={cn('rounded-xl p-4 text-white relative overflow-hidden', statusGradient[status])}>
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
                          <button onClick={handleCopyPhone} className="text-text-tertiary hover:text-sapphire-500 transition-colors cursor-pointer p-1">
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
                  <div className="grid grid-cols-2 gap-2">
                    {member.fee === 'due' ? (
                      <ActionBtn 
                        onClick={() => { onMarkPaid(member.seat); onClose(); }} 
                        icon={<CreditCard className="w-4 h-4" />}
                        className="bg-emerald-500 text-white shadow-sm hover:shadow-md hover:bg-emerald-600 border-transparent"
                      >
                        Mark Paid
                      </ActionBtn>
                    ) : (
                      <ActionBtn 
                        onClick={() => { onMarkDue(member.seat); onClose(); }} 
                        icon={<CreditCard className="w-4 h-4" />}
                        className="bg-saffron-50 dark:bg-saffron-900/10 text-saffron-800 dark:text-saffron-400 border border-saffron-500/30 hover:bg-saffron-500/10"
                      >
                        Mark Due
                      </ActionBtn>
                    )}
                    <ActionBtn 
                      onClick={() => { reset({ renewDate: todayISO(), renewDuration: '3M' }); setRenewMode(true); }} 
                      icon={<RefreshCw className="w-4 h-4" />}
                      className="bg-sapphire-500 text-white shadow-sm hover:shadow-md hover:bg-sapphire-600 border-transparent"
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
                    className="w-full flex items-center justify-center gap-2 text-center text-sm font-bold text-ruby-600 dark:text-ruby-400 py-2.5 rounded-xl border border-ruby-500/20 hover:bg-ruby-500/10 transition-colors cursor-pointer"
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
            onSubmit={handleSubmit((data) => {
              onRenew(member.seat, data.renewDate, data.renewDuration);
              setRenewMode(false);
              onClose();
            })}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="bg-sapphire-500 rounded-xl p-4 text-white shadow-lg shadow-sapphire-500/20">
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Renewal</p>
              <h4 className="text-lg font-black mt-1 tracking-tight">
                Seat {member.seat} — {member.name.split(' ')[0]}
              </h4>
            </div>

            <div className="space-y-4 pt-2">
              <FloatingLabelInput
                label="New join date"
                type="date"
                {...register('renewDate')}
              />

              <div>
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Duration</span>
                <Controller
                  name="renewDuration"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-1.5 mt-1.5 bg-[var(--bg-base)] p-1.5 rounded-xl border border-[var(--border-default)] shadow-inner shadow-black/5 dark:shadow-black/20">
                      {(['1M', '3M', '6M', '1Y'] as Duration[]).map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => field.onChange(d)}
                          className={cn(
                            'flex-1 py-3 rounded-lg text-[13px] font-bold transition-all duration-300 cursor-pointer relative overflow-hidden',
                            field.value === d
                              ? 'bg-sapphire-500 text-white shadow-md scale-100 ring-1 ring-sapphire-500/50 z-10'
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
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">New expiry date</span>
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-1 flex justify-center items-center gap-2">
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
                className="flex-[1.5] py-3.5 rounded-xl text-xs font-black uppercase tracking-widest bg-sapphire-500 text-white hover:bg-sapphire-600 transition-all cursor-pointer shadow-lg shadow-sapphire-500/20 hover:shadow-xl hover:shadow-sapphire-500/30 active:scale-95"
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
        onClose={() => { setRenewMode(false); onClose(); }}
        title={`Seat ${String(member.seat).padStart(2, '0')}`}
        snapPoint="60%"
      >
        {content}
      </BottomSheet>
    );
  }

  // Desktop: right panel — glassmorphism treatment
  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop overlay */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[var(--bg-void)]/20 backdrop-blur-sm z-30"
              onClick={() => { setRenewMode(false); onClose(); }}
            />
            <m.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed top-0 right-0 h-screen w-[340px] bg-[var(--bg-surface)] border-l border-[var(--border-default)] shadow-[var(--shadow-xl)] z-40 overflow-y-auto"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-[var(--text-primary)] font-mono flex items-center gap-2">
                    <span className="w-8 h-8 bg-gradient-to-br from-sapphire-500 to-sapphire-600 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm">
                      {String(member.seat).padStart(2, '0')}
                    </span>
                    Seat Details
                  </h3>
                  <button
                    onClick={() => { setRenewMode(false); onClose(); }}
                    className="cursor-pointer rounded-xl p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-base)] transition-all hover:rotate-90 duration-200"
                    aria-label="Close panel"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {content}
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </LazyMotion>
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
