'use client';

import { useMemo, useEffect } from 'react';
import { type Member } from '@/lib/types';
import { calcExpiry, todayISO, cn } from '@/lib/utils';
import { Zap, Upload, CheckCircle2, User, Phone as PhoneIcon } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';

const addMemberSchema = z.object({
  seat: z.number().min(1, 'Seat is required'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  shift: z.enum(['morning', 'evening', 'full']),
  joinDate: z.string().min(1, 'Join date is required').refine(date => new Date(date) <= new Date(), {
    message: 'Join date cannot be in the future',
  }),
  duration: z.enum(['1M', '3M', '6M', '1Y']),
  fee: z.enum(['paid', 'due']),
  paymentMode: z.enum(['upi', 'cash']),
  documentStatus: z.string().min(1, 'Document is required'),
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
      shift: 'morning',
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setValue('documentStatus', e.target.files[0].name, { shouldValidate: true });
    }
  };

  const handleFormSubmit = (data: AddMemberFormValues) => {
    onSubmit(data.seat, { 
      name: data.name.trim(), 
      phone: data.phone, 
      shift: data.shift, 
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
    reset({
      seat: vacantSeats[0] || -1,
      name: '',
      phone: '',
      shift: 'morning',
      joinDate: todayISO(),
      duration: '3M',
      fee: 'paid',
      paymentMode: 'upi',
      documentStatus: '',
      termsAccepted: { rules: false, damage: false, nonRefundable: false },
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" noValidate>
      {/* Seat Selection */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
          <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wide">
            Seat Allotment
          </h3>
          <span className="flex items-center gap-1.5 rounded-lg bg-[var(--sapphire-500)]/10 px-3 py-1.5 text-xs font-bold text-[var(--sapphire-500)] hover:bg-[var(--sapphire-500)]/20 transition-colors">
            <Zap className="w-3.5 h-3.5" />
            {vacantSeats.length} Available
          </span>
        </div>

        <FieldGroup label="Seat Number" required error={errors.seat?.message}>
          <select
            {...register('seat', { valueAsNumber: true })}
            className="w-full cursor-pointer rounded-xl border border-[var(--border-default)] px-4 py-3.5 text-sm font-mono font-bold bg-[var(--bg-surface)]/50 text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--saffron-500)]/10 focus:border-[var(--saffron-500)]/50 backdrop-blur-md transition-all duration-300"
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
        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wide border-b border-[var(--border-default)] pb-4">
          Member Details
        </h3>

        {/* Name */}
        <FloatingLabelInput 
          label="Full Name" 
          icon={<User className="w-4 h-4" />}
          error={errors.name?.message}
          {...register('name')}
        />

        {/* WhatsApp + Shift */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
          <FloatingLabelInput 
            label="WhatsApp Number" 
            icon={<PhoneIcon className="w-4 h-4" />}
            type="tel"
            inputMode="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <FieldGroup label="Shift" required error={errors.shift?.message}>
            <Controller
              name="shift"
              control={control}
              render={({ field }) => (
                <SegmentedControl
                  options={[
                    { value: 'morning', label: 'Morning' },
                    { value: 'evening', label: 'Evening' },
                    { value: 'full', label: 'Full' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </FieldGroup>
        </div>

        {/* Join Date + Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
          <FloatingLabelInput 
            label="Date of Joining" 
            type="date"
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
        
        {/* Document Upload */}
        <div className="pt-2">
          <FieldGroup label="Aadhar/Pan card" required error={errors.documentStatus?.message}>
            <div className="relative border-2 border-dashed border-[var(--border-default)] rounded-xl p-8 hover:bg-[var(--bg-base)] transition-all duration-200 text-center group cursor-pointer bg-surface/30">
              <input 
                type="file" 
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {watchDocumentStatus ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-10 h-10 text-green-500 shrink-0 drop-shadow-sm" />
                  <span className="text-sm font-bold text-[var(--text-primary)]">{watchDocumentStatus}</span>
                  <span className="text-xs font-semibold text-[var(--text-secondary)] group-hover:text-[var(--saffron-500)] transition-colors">Click to replace file</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-[var(--text-secondary)] group-hover:text-[var(--saffron-500)] transition-colors">
                  <div className="bg-[var(--bg-base)] p-3 rounded-full shadow-sm border border-[var(--border-default)] transition-transform group-hover:scale-110 duration-200">
                    <Upload className="w-5 h-5 text-current" />
                  </div>
                  <div>
                    <span className="text-[13px] font-bold block text-[var(--saffron-500)] drop-shadow-sm">Add file</span>
                    <span className="text-[11px] font-medium opacity-80 mt-1 block tracking-wide">Upload 1 supported file. Max 100 MB.</span>
                  </div>
                </div>
              )}
            </div>
          </FieldGroup>
        </div>
      </div>

      {/* Payment Section */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wide border-b border-[var(--border-default)] pb-4">
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
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
            <p className="text-[13px] font-black tracking-wide text-[var(--text-primary)] mb-4 uppercase">Scan to pay via UPI</p>
            <div className="p-3 bg-white rounded-xl shadow-sm border border-black/5">
              <QRCodeCanvas 
                value={`upi://pay?pa=9462572575@axl&pn=KAMLESH%20SINGH%20ASDLIYA&cu=INR`}
                size={160}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-[11px] font-bold text-[var(--text-secondary)] mt-4 px-4 py-1.5 bg-[var(--bg-surface)] border rounded-full drop-shadow-sm">UPI ID: 9462572575@axl</p>
          </div>
        )}
      </div>

      {/* Terms & Conditions */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-4">
        <h3 className="text-[13px] font-black text-red-500 uppercase tracking-wide border-b border-[var(--border-default)] pb-4 mb-5 flex items-center gap-2">
          Declaration & Terms and Condition 
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse"></span>
        </h3>
        
        <label className="flex items-start gap-4 cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-[var(--bg-base)] transition-colors">
          <input 
            type="checkbox" 
            {...register('termsAccepted.rules')}
            className="mt-1 w-5 h-5 rounded border-2 border-[var(--border-default)] text-[var(--saffron-500)] focus:ring-[var(--saffron-500)] accent-[var(--saffron-500)] cursor-pointer transition-transform group-hover:scale-105" 
          />
          <span className={cn(
            "text-[13px] font-medium leading-relaxed group-hover:text-[var(--saffron-500)] transition-colors pt-0.5",
            errors.termsAccepted?.rules ? "text-red-500 font-bold" : "text-[var(--text-primary)]"
          )}>
            I agree to follow all rules and regulations of the library.
          </span>
        </label>
        
        <label className="flex items-start gap-4 cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-[var(--bg-base)] transition-colors">
          <input 
            type="checkbox" 
            {...register('termsAccepted.damage')}
            className="mt-1 w-5 h-5 rounded border-2 border-[var(--border-default)] text-[var(--saffron-500)] focus:ring-[var(--saffron-500)] accent-[var(--saffron-500)] cursor-pointer transition-transform group-hover:scale-105" 
          />
          <span className={cn(
            "text-[13px] font-medium leading-relaxed group-hover:text-[var(--saffron-500)] transition-colors pt-0.5",
            errors.termsAccepted?.damage ? "text-red-500 font-bold" : "text-[var(--text-primary)]"
          )}>
            I will be held responsible for any damage caused by me and agree to pay for the same.
          </span>
        </label>
        
        <label className="flex items-start gap-4 cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-[var(--bg-base)] transition-colors">
          <input 
            type="checkbox" 
            {...register('termsAccepted.nonRefundable')}
            className="mt-1 w-5 h-5 rounded border-2 border-[var(--border-default)] text-[var(--saffron-500)] focus:ring-[var(--saffron-500)] accent-[var(--saffron-500)] cursor-pointer transition-transform group-hover:scale-105" 
          />
          <span className={cn(
            "text-[13px] font-medium leading-relaxed group-hover:text-[var(--saffron-500)] transition-colors pt-0.5",
            errors.termsAccepted?.nonRefundable ? "text-red-500 font-bold" : "text-[var(--text-primary)]"
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
          className="flex-1 rounded-xl bg-[var(--saffron-500)] py-4 text-[13px] font-black tracking-widest uppercase text-[#1a1a16] hover:brightness-110 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--saffron-500)]/20 hover:shadow-xl hover:shadow-[var(--saffron-500)]/30 active:scale-[0.98]"
        >
          Submit Form
        </button>
        <button
          type="button"
          onClick={clearForm}
          className="rounded-xl border border-[var(--border-default)] px-6 text-[13px] font-black uppercase text-[var(--text-secondary)] hover:bg-[var(--bg-base)] hover:text-red-500 transition-all duration-300 cursor-pointer shadow-sm active:scale-[0.98]"
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
    <div className="flex flex-col">
      <label className="block text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] mb-2 ml-1">
        {label}
        {required && <span className="text-red-500 ml-1.5 text-sm leading-none">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-2 ml-1 text-[11px] font-bold text-red-500 flex items-center gap-1.5 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block shadow-sm"></span>
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
    <div className="flex gap-1.5 bg-[var(--bg-base)] p-1.5 rounded-xl border border-[var(--border-default)] w-full shadow-inner shadow-black/5 dark:shadow-black/20">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 py-3 rounded-lg text-[13px] font-bold transition-all duration-300 cursor-pointer relative overflow-hidden',
            value === opt.value
              ? 'bg-[var(--sapphire-500)] text-[#1a1a16] shadow-md scale-100 ring-1 ring-[var(--sapphire-500)]/50 z-10'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass)] scale-[0.98] hover:scale-100 z-0',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

