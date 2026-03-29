'use client';

import { useState } from 'react';
import { type Member, type Duration, type SeatStatus } from '@/lib/types';
import { getSeatStatus, fmtDate, durationLabel, shiftLabel, calcExpiry, todayISO, cn, daysUntilExpiry } from '@/lib/utils';
import BottomSheet from '@/components/ui/BottomSheet';
import Modal from '@/components/ui/Modal';
import { Phone, Calendar, Clock, Sun, Moon, Zap, X, RefreshCw, Trash2, CreditCard, MessageCircle, Copy } from 'lucide-react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';

interface SeatDetailPanelProps {
  member: Member | null;
  open: boolean;
  onClose: () => void;
  onMarkPaid: (seat: number) => void;
  onMarkDue: (seat: number) => void;
  onRenew: (seat: number, joinDate: string, duration: Duration) => void;
  onRemove: (seat: number) => void;
  isMobile: boolean;
}

// ── Status gradient banner config ──────────────────
const statusGradient: Record<SeatStatus, string> = {
  active: 'gradient-green',
  expiring: 'gradient-amber',
  expired: 'gradient-red',
  due: 'gradient-amber',
  vacant: 'bg-vacant-fill dark:bg-vacant-fill-dark',
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
}: SeatDetailPanelProps) {
  const [renewMode, setRenewMode] = useState(false);
  const [renewDate, setRenewDate] = useState(todayISO());
  const [renewDuration, setRenewDuration] = useState<Duration>('3M');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!member) return null;

  const status = getSeatStatus(member);
  const renewExpiry = calcExpiry(renewDate, renewDuration);
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
                <div className="space-y-1 bg-bg dark:bg-bg-dark rounded-xl p-3">
                  <InfoRow 
                    icon={<Phone className="w-4 h-4 text-blue-accent" />} 
                    label="Phone" 
                    value={member.phone || '—'}
                    action={member.phone ? (
                      <button onClick={handleCopyPhone} className="text-text-tertiary hover:text-blue-accent transition-colors cursor-pointer p-1">
                        {copied ? <span className="text-[10px] font-bold text-active-text">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    ) : undefined}
                  />
                  <InfoRow icon={<Calendar className="w-4 h-4 text-blue-accent" />} label="Joined" value={fmtDate(member.joinDate)} />
                  <InfoRow icon={<Clock className="w-4 h-4 text-blue-accent" />} label="Duration" value={durationLabel(member.duration as Duration)} />
                  <InfoRow icon={<Calendar className="w-4 h-4 text-blue-accent" />} label="Expires" value={fmtDate(member.expiry)} />
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {member.fee === 'due' ? (
                      <ActionBtn 
                        onClick={() => { onMarkPaid(member.seat); onClose(); }} 
                        icon={<CreditCard className="w-4 h-4" />}
                        className="gradient-green text-white shadow-sm"
                      >
                        Mark Paid
                      </ActionBtn>
                    ) : (
                      <ActionBtn 
                        onClick={() => { onMarkDue(member.seat); onClose(); }} 
                        icon={<CreditCard className="w-4 h-4" />}
                        className="bg-due-fill dark:bg-due-fill-dark text-due-text dark:text-due-text-dark border border-due-border/30"
                      >
                        Mark Due
                      </ActionBtn>
                    )}
                    <ActionBtn 
                      onClick={() => { setRenewMode(true); setRenewDate(todayISO()); }} 
                      icon={<RefreshCw className="w-4 h-4" />}
                      className="gradient-blue text-white shadow-sm"
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
                    className="w-full flex items-center justify-center gap-2 text-center text-sm font-bold text-expired-text dark:text-expired-text-dark py-2.5 rounded-xl border border-expired-border/20 hover:bg-expired-fill dark:hover:bg-expired-fill-dark transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Member
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          /* Renewal form */
          <m.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="gradient-blue rounded-xl p-4 text-white">
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Renewal</p>
              <h4 className="text-lg font-black mt-1">
                Seat {member.seat} — {member.name}
              </h4>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
                New join date
                <input
                  type="date"
                  value={renewDate}
                  onChange={e => setRenewDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-card-border dark:border-card-border-dark bg-input-bg dark:bg-input-bg-dark px-3 py-3 text-sm font-medium text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-blue-accent/30 focus:border-blue-accent/50 outline-none transition-all"
                />
              </label>

              <div>
                <span className="text-xs font-bold text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">Duration</span>
                <div className="flex gap-1.5 mt-1.5">
                  {(['1M', '3M', '6M', '1Y'] as Duration[]).map(d => (
                    <button
                      key={d}
                      onClick={() => setRenewDuration(d)}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border',
                        renewDuration === d
                          ? 'gradient-blue text-white border-transparent shadow-sm'
                          : 'bg-bg dark:bg-bg-dark border-card-border dark:border-card-border-dark text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark',
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-active-fill dark:bg-active-fill-dark border border-active-border/20 p-3">
                <span className="text-xs font-bold text-active-text dark:text-active-text-dark uppercase tracking-wider">New expiry date</span>
                <p className="text-base font-black text-active-text dark:text-active-text-dark mt-1">
                  {renewExpiry ? fmtDate(renewExpiry) : '—'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setRenewMode(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-card-border dark:border-card-border-dark text-text-secondary dark:text-text-secondary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (renewDuration) {
                    onRenew(member.seat, renewDate, renewDuration);
                    setRenewMode(false);
                    onClose();
                  }
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold gradient-blue text-white hover:opacity-90 transition-all cursor-pointer shadow-sm shadow-blue-accent/20"
              >
                Confirm Renewal
              </button>
            </div>
          </m.div>
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
              className="fixed inset-0 bg-black/10 backdrop-blur-sm z-30"
              onClick={() => { setRenewMode(false); onClose(); }}
            />
            <m.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed top-0 right-0 h-screen w-[340px] bg-surface dark:bg-surface-dark border-l border-card-border dark:border-card-border-dark shadow-2xl z-40 overflow-y-auto"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-text-primary dark:text-text-primary-dark font-mono flex items-center gap-2">
                    <span className="w-8 h-8 gradient-blue rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm">
                      {String(member.seat).padStart(2, '0')}
                    </span>
                    Seat Details
                  </h3>
                  <button
                    onClick={() => { setRenewMode(false); onClose(); }}
                    className="cursor-pointer rounded-xl p-2 text-text-tertiary dark:text-text-tertiary-dark hover:bg-bg dark:hover:bg-bg-dark transition-all hover:rotate-90 duration-200"
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
      <span className="text-xs font-bold text-text-tertiary dark:text-text-tertiary-dark uppercase tracking-wider w-16 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-text-primary dark:text-text-primary-dark flex-1">{value}</span>
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
