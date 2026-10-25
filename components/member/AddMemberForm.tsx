'use client';

import { useMemo, useEffect, useState } from 'react';
import { type Member } from '@/lib/types';
import { calcExpiry, todayISO, cn } from '@/lib/utils';
import { Zap, User, Phone as PhoneIcon } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
import { phoneInput } from '@/lib/schemas';
import { UPI, upiPayLink } from '@/lib/siteInfo';
import { formatINR, planPrice } from '@/lib/pricing';
import { addDaysISO } from '@/lib/seat-status';

/** How far ahead a membership may start — someone paying today for Monday. */
const MAX_DAYS_AHEAD = 7;

/** What is stored when staff tick the ID box. */
const ID_CHECKED = 'ID checked at desk';

const addMemberSchema = z.object({
  seat: z.number().min(1, 'Seat is required'),
  name: z.string().min(1, 'Name is required'),
  phone: phoneInput,
  // ISO dates compare as strings. A start date up to a week ahead is allowed.
  joinDate: z.string().min(1, 'Join date is required').refine(
    (date) => date <= addDaysISO(todayISO(), MAX_DAYS_AHEAD),
    { message: `Join date can be at most ${MAX_DAYS_AHEAD} days ahead` },
  ),
  duration: z.enum(['1M', '3M', '6M', '1Y']),
  fee: z.enum(['paid', 'due']),
  paymentMode: z.enum(['upi', 'cash']),
  documentStatus: z.string().min(1, "Check the student's ID first"),
  termsAccepted: z.object({
    rules: z.boolean().refine(val => val === true, { message: 'Required' }),
    damage: z.boolean().refine(val => val === true, { message: 'Required' }),
    nonRefundable: z.boolean().refine(val => val === true, { message: 'Required' }),
  }),
});

type AddMemberFormValues = z.infer<typeof addMemberSchema>;

interface AddMemberFormProps {
  vacantSeats: number[];
  onSubmit: (seat: number, data: Omit<Member, 'seat' | 'vacant'>) => void;
  initialData?: { name: string; phone: string; paymentMode: 'upi' | 'cash' };
}

export default function AddMemberForm({ vacantSeats, onSubmit, initialData }: AddMemberFormProps) {
  const { register, handleSubmit, control, setValue, formState: { errors, isValid }, reset } = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      seat: vacantSeats[0] || -1,
      name: initialData?.name || '',
      phone: initialData?.phone || '',
      joinDate: todayISO(),
      duration: '3M',
      fee: 'paid',
      paymentMode: initialData?.paymentMode || 'upi',
      documentStatus: '',
      termsAccepted: { rules: false, damage: false, nonRefundable: false },
    },
    mode: 'onChange',
  });

  const watchSeat = useWatch({ control, name: 'seat' });
  const watchJoinDate = useWatch({ control, name: 'joinDate' });
  const watchDuration = useWatch({ control, name: 'duration' });
  const watchPaymentMode = useWatch({ control, name: 'paymentMode' });
  const watchDocumentStatus = useWatch({ control, name: 'documentStatus' });
  // Follows the plan price until staff type their own (e.g. a discount);
  // empty puts no amount in the QR, so the student enters it in their app.
  const [amountTyped, setAmountTyped] = useState<string | null>(null);
  const amountText = amountTyped ?? String(planPrice(watchDuration));
  const amount = Number(amountText) || 0;

  // Auto-select first vacant if available when vacantSeats changes
  useEffect(() => {
    if (vacantSeats.length > 0 && !vacantSeats.includes(watchSeat)) {
      setValue('seat', vacantSeats[0]);
    }
  }, [vacantSeats, watchSeat, setValue]);

  const expiry = useMemo(() => {
    try {
      return calcExpiry(watchJoinDate, watchDuration);
    } catch {
      return '';
    }
  }, [watchJoinDate, watchDuration]);

  // Auto-mark fee as paid if picking UPI or Cash
  useEffect(() => {
    if (watchPaymentMode) {
      setValue('fee', 'paid');
    }
  }, [watchPaymentMode, setValue]);

  const handleFormSubmit = (data: AddMemberFormValues) => {
    onSubmit(data.seat, { 
      name: data.name.trim(), 
      phone: data.phone.replace(/\D/g, ''), 
      shift: 'full', 
      joinDate: data.joinDate, 
      duration: data.duration, 
      expiry, 
      fee: data.fee,
      paymentMode: data.paymentMode,
      documentStatus: data.documentStatus,
      termsAccepted: true
    });
  };

  const clearForm = () => {
    setAmountTyped(null);
    reset({
      seat: vacantSeats[0] || -1,
      name: '',
      phone: '',
      joinDate: todayISO(),
      duration: '3M',
      fee: 'paid',
      paymentMode: 'upi',
      documentStatus: '',
      termsAccepted: { rules: false, damage: false, nonRefundable: false },
    });
  };

  return (
    <div className="@container px-1 pb-4">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" noValidate>
      {/* Seat Selection */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Seat Allotment
          </h3>
          <span className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-muted)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)]">
            <Zap className="size-4" />
            {vacantSeats.length} Available
          </span>
        </div>

        <FieldGroup label="Seat Number" required error={errors.seat?.message}>
          <select
            {...register('seat', { valueAsNumber: true })}
            className="w-full cursor-pointer rounded-xl border border-[var(--border-default)] px-4 py-3.5 text-sm font-mono font-bold bg-[var(--bg-surface)]/50 text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--saffron-500)]/10 focus:border-[var(--saffron-200)] transition-ui duration-300 shadow-[var(--shadow-xs)]"
          >
            {vacantSeats.length === 0 ? (
              <option value="-1">No seats available</option>
            ) : (
              vacantSeats.map(s => (
                <option key={s} value={s}>
                  Seat #{String(s).padStart(2, '0')}
                </option>
              ))
            )}
          </select>
        </FieldGroup>
      </div>

      {/* Form fields */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--border-default)] pb-4">
          Member Details
        </h3>

        {/* Name */}
        <FloatingLabelInput 
          label="Full Name" 
          icon={<User className="size-4" />}
          error={errors.name?.message}
          {...register('name')}
        />

        {/* WhatsApp + Join Date + Duration */}
        <div className="grid grid-cols-1 gap-5 mt-4">
          <FloatingLabelInput 
            label="WhatsApp Number" 
            icon={<PhoneIcon className="size-4" />}
            type="tel"
            inputMode="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-5 @md:grid-cols-2">
          <FloatingLabelInput 
            label="Date of Joining" 
            type="date"
            max={addDaysISO(todayISO(), MAX_DAYS_AHEAD)}
            error={errors.joinDate?.message}
            {...register('joinDate')}
          />
          <FieldGroup label="Membership Duration" required error={errors.duration?.message}>
            <Controller
              name="duration"
              control={control}
              render={({ field }) => (
                <SegmentedControl
                  options={[
                    { value: '1M', label: '1M' },
                    { value: '3M', label: '3M' },
                    { value: '6M', label: '6M' },
                    { value: '1Y', label: '1Y' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </FieldGroup>
        </div>
        
        {/* ID check. This was a file picker that only ever saved the file's
            *name* — the image was never stored — so it promised a copy of the
            ID that did not exist. Staff look at the ID; this records that. */}
        <div className="pt-2">
          <FieldGroup label="ID document" required error={errors.documentStatus?.message}>
            <label className="flex items-start gap-4 cursor-pointer group rounded-xl border border-[var(--border-default)] p-4 hover:bg-[var(--bg-base)] transition-colors">
              <input
                type="checkbox"
                checked={!!watchDocumentStatus}
                onChange={(e) => setValue('documentStatus', e.target.checked ? ID_CHECKED : '', { shouldValidate: true })}
                className="mt-1 size-5 rounded border-2 border-[var(--border-default)] accent-[var(--saffron-500)] cursor-pointer"
              />
              <span className="text-sm leading-relaxed">
                <span className="block font-medium text-[var(--text-primary)]">I have checked the student&apos;s ID at the desk</span>
                <span className="mt-0.5 block text-[var(--text-secondary)]">Aadhaar, PAN or college ID. Seen in person — no copy is stored.</span>
              </span>
            </label>
          </FieldGroup>
        </div>
      </div>

      {/* Payment Section */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--border-default)] pb-4">
          Payment Details
        </h3>
        
        <FieldGroup label="Mode Of Payment" required>
          <Controller
            name="paymentMode"
            control={control}
            render={({ field }) => (
              <SegmentedControl
                options={[
                  { value: 'upi', label: 'UPI' },
                  { value: 'cash', label: 'Cash' },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FieldGroup>
        
        {watchPaymentMode === 'upi' && (
          <div className="bg-[var(--bg-base)] rounded-xl p-6 flex flex-col items-center justify-center border border-[var(--border-default)] mt-2 text-center animate-in fade-in zoom-in-95 duration-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 w-full h-1 bg-[var(--saffron-500)]" />
            <label htmlFor="add-amount" className="mb-1.5 self-stretch text-left text-sm font-medium text-[var(--text-primary)]">
              Amount (₹)
            </label>
            <input
              id="add-amount"
              type="text"
              inputMode="numeric"
              value={amountText}
              onChange={(e) => setAmountTyped(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="mb-1.5 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 font-mono text-base tabular text-[var(--text-primary)] focus:border-[var(--saffron-600)] focus:outline-none focus:ring-2 focus:ring-[var(--saffron-600)]/20"
            />
            <p className="mb-4 self-stretch text-left text-xs text-[var(--text-secondary)]">
              {watchDuration} plan is {formatINR(planPrice(watchDuration))}. Clear it to let the student enter the amount in their app.
            </p>
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-4">
              {amount > 0
                ? <>Scan to pay <span className="tabular">{formatINR(amount)}</span> via UPI</>
                : 'Scan, then enter the amount in the UPI app'}
            </p>
            <div className="p-3 bg-[var(--bg-surface)] rounded-xl shadow-sm border border-black/5">
              <QRCodeCanvas 
                value={upiPayLink(amount, `Seat ${watchSeat} ${watchDuration}`)}
                size={160}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-xs font-bold text-[var(--text-secondary)] mt-4 px-4 py-1.5 bg-[var(--bg-surface)] border rounded-full drop-shadow-sm">UPI ID: {UPI.id}</p>
          </div>
        )}
      </div>

      {/* Terms & Conditions */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-[var(--ruby-600)] border-b border-[var(--border-default)] pb-4 mb-5 flex items-center gap-2">
          Declaration & Terms and Condition 
          <span className="inline-block size-1.5 rounded-full bg-[var(--ruby-500)]" />
        </h3>
        
        <label className="flex items-start gap-4 cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-[var(--bg-base)] transition-colors">
          <input 
            type="checkbox" 
            {...register('termsAccepted.rules')}
            className="mt-1 size-5 rounded border-2 border-[var(--border-default)] text-[var(--saffron-600)] focus:ring-[var(--saffron-500)] accent-[var(--saffron-500)] cursor-pointer transition-transform group-hover:scale-105" 
          />
          <span className={cn(
            "text-sm font-medium leading-relaxed group-hover:text-[var(--saffron-600)] transition-colors pt-0.5",
            errors.termsAccepted?.rules ? "text-[var(--ruby-600)] font-bold" : "text-[var(--text-primary)]"
          )}>
            I agree to follow all rules and regulations of the library.
          </span>
        </label>
        
        <label className="flex items-start gap-4 cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-[var(--bg-base)] transition-colors">
          <input 
            type="checkbox" 
            {...register('termsAccepted.damage')}
            className="mt-1 size-5 rounded border-2 border-[var(--border-default)] text-[var(--saffron-600)] focus:ring-[var(--saffron-500)] accent-[var(--saffron-500)] cursor-pointer transition-transform group-hover:scale-105" 
          />
          <span className={cn(
            "text-sm font-medium leading-relaxed group-hover:text-[var(--saffron-600)] transition-colors pt-0.5",
            errors.termsAccepted?.damage ? "text-[var(--ruby-600)] font-bold" : "text-[var(--text-primary)]"
          )}>
            I will be held responsible for any damage caused by me and agree to pay for the same.
          </span>
        </label>
        
        <label className="flex items-start gap-4 cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-[var(--bg-base)] transition-colors">
          <input 
            type="checkbox" 
            {...register('termsAccepted.nonRefundable')}
            className="mt-1 size-5 rounded border-2 border-[var(--border-default)] text-[var(--saffron-600)] focus:ring-[var(--saffron-500)] accent-[var(--saffron-500)] cursor-pointer transition-transform group-hover:scale-105" 
          />
          <span className={cn(
            "text-sm font-medium leading-relaxed group-hover:text-[var(--saffron-600)] transition-colors pt-0.5",
            errors.termsAccepted?.nonRefundable ? "text-[var(--ruby-600)] font-bold" : "text-[var(--text-primary)]"
          )}>
            Membership is Non-refundable and Non-transferable.
          </span>
        </label>
      </div>

      {/* Submit */}
      <div className="flex gap-4 pb-8">
        <button
          type="submit"
          disabled={vacantSeats.length === 0 || !isValid}
          className="flex-1 min-h-[48px] rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--ink)] text-sm font-semibold text-[var(--text-inverse)] hover:bg-[var(--ink-hover)] transition-ui cursor-pointer disabled:cursor-not-allowed disabled:border-[var(--border-default)] disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-disabled)] active:scale-[0.98]"
        >
          Allot seat
        </button>
        <button
          type="button"
          onClick={clearForm}
          className="rounded-xl border border-[var(--border-default)] px-6 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-base)] hover:text-[var(--ruby-600)] transition-ui duration-300 cursor-pointer shadow-sm active:scale-[0.98]"
        >
          Clear
        </button>
      </div>
    </form>
    </div>
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
    <div className="flex flex-col">
      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 ml-1">
        {label}
        {required && <span className="text-[var(--ruby-600)] ml-1.5 text-sm leading-none">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-2 ml-1 text-xs font-bold text-[var(--ruby-600)] flex items-center gap-1.5">
          <span className="inline-block size-1.5 rounded-full bg-[var(--ruby-500)]" />
          {error}
        </p>
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
    <div className="flex gap-1.5 bg-[var(--bg-base)] p-1.5 rounded-xl border border-[var(--border-default)] w-full shadow-inner shadow-black/5">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 py-3 rounded-lg text-sm font-bold transition-ui duration-300 cursor-pointer relative overflow-hidden',
            value === opt.value
              ? 'bg-[var(--saffron-500)] text-[var(--text-inverse)] shadow-md scale-100 ring-1 ring-[var(--saffron-500)]/50 z-10'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass)] scale-[0.98] hover:scale-100 z-0',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

