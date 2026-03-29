'use client';

import { useState } from 'react';
import { type Member, type Duration } from '@/lib/types';
import { getSeatStatus, fmtDate, durationLabel, shiftLabel, calcExpiry, todayISO, cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import BottomSheet from '@/components/ui/BottomSheet';
import Modal from '@/components/ui/Modal';
import { Phone, Calendar, Clock, Sun, Moon, Zap } from 'lucide-react';

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

  if (!member) return null;

  const status = getSeatStatus(member);
  const renewExpiry = calcExpiry(renewDate, renewDuration);

  const shiftIcon = member.shift === 'evening' ? (
    <Moon className="w-4 h-4" />
  ) : member.shift === 'full' ? (
    <Zap className="w-4 h-4" />
  ) : (
    <Sun className="w-4 h-4" />
  );

  const content = (
    <div className="space-y-4">
      {!renewMode ? (
        <>
          {/* Member info */}
          <div>
            <h4 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
              {member.vacant ? 'Vacant Seat' : member.name}
            </h4>
            {!member.vacant && <Badge status={status} />}
          </div>

          {!member.vacant && (
            <>
              <div className="space-y-2.5 pt-2 border-t border-card-border dark:border-card-border-dark">
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={member.phone || '—'} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Joined" value={fmtDate(member.joinDate)} />
                <InfoRow icon={<Clock className="w-4 h-4" />} label="Duration" value={durationLabel(member.duration as Duration)} />
                <InfoRow icon={shiftIcon} label="Shift" value={shiftLabel(member.shift)} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Expires" value={fmtDate(member.expiry)} />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-card-border dark:border-card-border-dark space-y-2">
                <div className="flex gap-2">
                  {member.fee === 'due' ? (
                    <ActionBtn onClick={() => { onMarkPaid(member.seat); onClose(); }} className="flex-1 bg-active-fill dark:bg-active-fill-dark text-active-text dark:text-active-text-dark border-active-border">
                      Mark Paid
                    </ActionBtn>
                  ) : (
                    <ActionBtn onClick={() => { onMarkDue(member.seat); onClose(); }} className="flex-1 bg-due-fill dark:bg-due-fill-dark text-due-text dark:text-due-text-dark border-due-border">
                      Mark Due
                    </ActionBtn>
                  )}
                  <ActionBtn onClick={() => { setRenewMode(true); setRenewDate(todayISO()); }} className="flex-1 bg-blue-accent/10 text-blue-accent border-blue-accent/30">
                    Renew
                  </ActionBtn>
                </div>
                <button
                  onClick={() => setConfirmRemove(true)}
                  className="w-full text-center text-sm font-medium text-expired-text dark:text-expired-text-dark py-2 rounded-lg border border-expired-border/30 hover:bg-expired-fill dark:hover:bg-expired-fill-dark transition-colors cursor-pointer"
                >
                  Remove Member
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        /* Renewal form */
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-text-primary dark:text-text-primary-dark">
            Renew — Seat {member.seat}, {member.name}
          </h4>

          <div className="space-y-3">
            <label className="block text-xs font-medium text-text-secondary dark:text-text-secondary-dark">
              New join date
              <input
                type="date"
                value={renewDate}
                onChange={e => setRenewDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-card-border dark:border-card-border-dark bg-input-bg dark:bg-input-bg-dark px-3 py-2.5 text-sm text-text-primary dark:text-text-primary-dark"
              />
            </label>

            <div>
              <span className="text-xs font-medium text-text-secondary dark:text-text-secondary-dark">Duration</span>
              <div className="flex gap-1.5 mt-1.5">
                {(['1M', '3M', '6M', '1Y'] as Duration[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setRenewDuration(d)}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border',
                      renewDuration === d
                        ? 'bg-blue-accent text-white border-blue-accent shadow-sm'
                        : 'bg-bg dark:bg-bg-dark border-card-border dark:border-card-border-dark text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark',
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-bg dark:bg-bg-dark p-3">
              <span className="text-xs text-text-tertiary dark:text-text-tertiary-dark">New expiry date</span>
              <p className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mt-0.5">
                {renewExpiry ? fmtDate(renewExpiry) : '—'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setRenewMode(false)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-card-border dark:border-card-border-dark text-text-secondary dark:text-text-secondary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (renewDuration) {
                  onRenew(member.seat, renewDate, renewDuration as '1M' | '3M' | '6M' | '1Y');
                  setRenewMode(false);
                  onClose();
                }
              }}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-blue-accent text-white hover:bg-blue-accent/90 transition-colors cursor-pointer"
            >
              Confirm Renewal
            </button>
          </div>
        </div>
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
  );

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onClose={() => { setRenewMode(false); onClose(); }}
        title={`Seat ${member.seat}`}
        snapPoint="60%"
      >
        {content}
      </BottomSheet>
    );
  }

  // Desktop: right panel
  if (!open) return null;
  return (
    <div className="fixed top-0 right-0 h-screen w-[320px] bg-surface dark:bg-surface-dark border-l border-card-border dark:border-card-border-dark shadow-xl z-20 overflow-y-auto animate-slide-in-right">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-text-primary dark:text-text-primary-dark font-mono">
            Seat {String(member.seat).padStart(2, '0')}
          </h3>
          <button
            onClick={() => { setRenewMode(false); onClose(); }}
            className="cursor-pointer text-text-tertiary dark:text-text-tertiary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors text-lg leading-none"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>
        {content}
      </div>
    </div>
  );
}

// ─── Helper components ──────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-text-tertiary dark:text-text-tertiary-dark">{icon}</span>
      <span className="text-xs text-text-tertiary dark:text-text-tertiary-dark w-16">{label}</span>
      <span className="text-sm font-medium text-text-primary dark:text-text-primary-dark">{value}</span>
    </div>
  );
}

function ActionBtn({ onClick, className, children }: { onClick: () => void; className: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border',
        className,
      )}
    >
      {children}
    </button>
  );
}
