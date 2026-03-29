'use client';

import { useState, useMemo, useEffect } from 'react';
import { type Member, type Duration, type Shift, type FeeStatus } from '@/lib/types';
import { calcExpiry, todayISO, fmtDate, cn } from '@/lib/utils';
import { Zap, Upload, CheckCircle2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface AddMemberFormProps {
  vacantSeats: number[];
  onSubmit: (seat: number, data: Omit<Member, 'seat' | 'vacant'>) => void;
}

export default function AddMemberForm({ vacantSeats, onSubmit }: AddMemberFormProps) {
  const [selectedSeat, setSelectedSeat] = useState<number>(vacantSeats[0] || -1);

  // Auto-select first vacant if available when vacantSeats changes
  useEffect(() => {
    if (vacantSeats.length > 0 && !vacantSeats.includes(selectedSeat)) {
      setSelectedSeat(vacantSeats[0]);
    }
  }, [vacantSeats, selectedSeat]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [shift, setShift] = useState<Shift>('morning');
  const [joinDate, setJoinDate] = useState(todayISO());
  const [duration, setDuration] = useState<Duration>('3M');
  const [fee, setFee] = useState<FeeStatus>('paid');
  
  // New Google Form Fields
  const [paymentMode, setPaymentMode] = useState<'upi' | 'cash'>('upi');
  const [documentStatus, setDocumentStatus] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState({
    rules: false,
    damage: false,
    nonRefundable: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const expiry = useMemo(() => calcExpiry(joinDate, duration), [joinDate, duration]);

  const allTermsAccepted = termsAccepted.rules && termsAccepted.damage && termsAccepted.nonRefundable;

  // Auto-mark fee as paid if picking UPI or Cash
  useEffect(() => {
    if (paymentMode) {
      setFee('paid');
    }
  }, [paymentMode]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!phone.trim()) errs.phone = 'WhatsApp Number is required';
    if (!joinDate) errs.joinDate = 'Join date is required';
    if (new Date(joinDate) > new Date()) errs.joinDate = 'Join date cannot be in the future';
    if (!duration) errs.duration = 'Select a duration';
    if (selectedSeat === -1) errs.seat = 'No vacant seat selected';
    if (!documentStatus) errs.documentStatus = 'Please upload a document';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDocumentStatus(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !allTermsAccepted) return;

    onSubmit(selectedSeat, { 
      name: name.trim(), 
      phone, 
      shift, 
      joinDate, 
      duration, 
      expiry, 
      fee,
      paymentMode,
      documentStatus,
      termsAccepted: allTermsAccepted
    });
    
    // reset happens on parent unmount or manually
  };

  const clearForm = () => {
    setName('');
    setPhone('');
    setShift('morning');
    setJoinDate(todayISO());
    setDuration('3M');
    setFee('paid');
    setPaymentMode('upi');
    setDocumentStatus('');
    setTermsAccepted({ rules: false, damage: false, nonRefundable: false });
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Seat Selection */}
      <div className="rounded-xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-card-border dark:border-card-border-dark pb-4">
          <h3 className="text-sm font-black text-text-primary dark:text-text-primary-dark uppercase tracking-wide">
            Seat Allotment
          </h3>
          <span className="flex items-center gap-1.5 rounded-lg bg-blue-accent/10 px-3 py-1.5 text-xs font-bold text-blue-accent hover:bg-blue-accent/20 transition-colors">
            <Zap className="w-3.5 h-3.5" />
            {vacantSeats.length} Available
          </span>
        </div>

        <FieldGroup label="Seat Number" required error={errors.seat}>
          <select
            value={selectedSeat}
            onChange={(e) => setSelectedSeat(Number(e.target.value))}
            className="w-full cursor-pointer rounded-lg border border-card-border dark:border-card-border-dark px-4 py-3 text-sm font-mono font-bold bg-input-bg dark:bg-input-bg-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-blue-accent/30 focus:border-blue-accent/50"
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
      <div className="rounded-xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-text-primary dark:text-text-primary-dark uppercase tracking-wide border-b border-card-border dark:border-card-border-dark pb-4">
          Member Details
        </h3>

        {/* Name */}
        <FieldGroup label="Full Name" required error={errors.name}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your answer"
            className={cn(
              'w-full rounded-lg border px-4 py-3 text-sm bg-input-bg dark:bg-input-bg-dark text-text-primary dark:text-text-primary-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary-dark focus:outline-none focus:ring-2 focus:ring-blue-accent/30',
              errors.name ? 'border-expired-border' : 'border-card-border dark:border-card-border-dark focus:border-blue-accent/50',
            )}
          />
        </FieldGroup>

        {/* WhatsApp + Shift */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FieldGroup label="Whatsapp Number" required error={errors.phone}>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Your answer"
              className={cn(
                'w-full rounded-lg border px-4 py-3 text-sm bg-input-bg dark:bg-input-bg-dark text-text-primary dark:text-text-primary-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary-dark focus:outline-none focus:ring-2 focus:ring-blue-accent/30',
                errors.phone ? 'border-expired-border' : 'border-card-border dark:border-card-border-dark focus:border-blue-accent/50',
              )}
            />
          </FieldGroup>

          <FieldGroup label="Shift" required>
            <SegmentedControl
              options={[
                { value: 'morning', label: 'Morning' },
                { value: 'evening', label: 'Evening' },
                { value: 'full', label: 'Full' },
              ]}
              value={shift}
              onChange={v => setShift(v as Shift)}
            />
          </FieldGroup>
        </div>

        {/* Join Date + Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FieldGroup label="Date Of Joining" required error={errors.joinDate}>
            <input
              type="date"
              value={joinDate}
              onChange={e => setJoinDate(e.target.value)}
              className={cn(
                'w-full cursor-pointer rounded-lg border px-4 py-3 text-sm bg-input-bg dark:bg-input-bg-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-blue-accent/30',
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
        
        {/* Document Upload */}
        <FieldGroup label="Aadhar/Pan card" required error={errors.documentStatus}>
          <div className="relative border-2 border-dashed border-card-border dark:border-card-border-dark rounded-xl p-8 hover:bg-bg dark:hover:bg-bg-dark transition-all duration-200 text-center group cursor-pointer">
            <input 
              type="file" 
              onChange={handleFileChange}
              accept="image/*,.pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {documentStatus ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-10 h-10 text-green-500 shrink-0" />
                <span className="text-sm font-bold text-text-primary dark:text-text-primary-dark">{documentStatus}</span>
                <span className="text-xs font-semibold text-text-secondary dark:text-text-secondary-dark group-hover:text-blue-accent transition-colors">Click to replace file</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-text-secondary dark:text-text-secondary-dark group-hover:text-blue-accent transition-colors">
                <div className="bg-bg dark:bg-bg-dark p-3 rounded-full shadow-sm border border-card-border dark:border-card-border-dark transition-transform group-hover:scale-110 duration-200">
                  <Upload className="w-5 h-5 text-current" />
                </div>
                <div>
                  <span className="text-[13px] font-bold block text-blue-accent">Add file</span>
                  <span className="text-[11px] font-medium opacity-80 mt-1 block">Upload 1 supported file. Max 100 MB.</span>
                </div>
              </div>
            )}
          </div>
        </FieldGroup>
      </div>

      {/* Payment Section */}
      <div className="rounded-xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-black text-text-primary dark:text-text-primary-dark uppercase tracking-wide border-b border-card-border dark:border-card-border-dark pb-4">
          Payment Details
        </h3>
        
        <FieldGroup label="Mode Of Payment" required>
          <SegmentedControl
            options={[
              { value: 'upi', label: 'UPI' },
              { value: 'cash', label: 'Cash' },
            ]}
            value={paymentMode}
            onChange={v => setPaymentMode(v as 'upi' | 'cash')}
          />
        </FieldGroup>
        
        {paymentMode === 'upi' && (
          <div className="bg-bg dark:bg-bg-dark rounded-xl p-6 flex flex-col items-center justify-center border border-card-border dark:border-card-border-dark mt-2 text-center animate-in fade-in zoom-in-95 duration-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
            <p className="text-[13px] font-black tracking-wide text-text-primary dark:text-text-primary-dark mb-4 uppercase">Scan to pay via UPI</p>
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <QRCodeCanvas 
                value={`upi://pay?pa=9462572575@axl&pn=KAMLESH%20SINGH%20ASDLIYA&cu=INR`}
                size={160}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-[11px] font-bold text-text-secondary dark:text-text-secondary-dark mt-4 px-4 py-1.5 bg-surface dark:bg-surface-dark border rounded-full">UPI ID: 9462572575@axl</p>
          </div>
        )}
      </div>

      {/* Terms & Conditions */}
      <div className="rounded-xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark p-6 shadow-sm space-y-4">
        <h3 className="text-[13px] font-black text-red-500 uppercase tracking-wide border-b border-card-border dark:border-card-border-dark pb-4 mb-5">
          Declaration & Terms and Condition *
        </h3>
        
        <label className="flex items-start gap-4 cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-bg dark:hover:bg-bg-dark transition-colors">
          <input 
            type="checkbox" 
            checked={termsAccepted.rules}
            onChange={(e) => setTermsAccepted({...termsAccepted, rules: e.target.checked})}
            className="mt-1 w-5 h-5 rounded border-2 border-card-border text-blue-accent focus:ring-blue-accent accent-blue-accent cursor-pointer" 
          />
          <span className="text-[13px] font-medium leading-relaxed text-text-primary dark:text-text-primary-dark group-hover:text-blue-accent transition-colors pt-0.5">
            I agree to follow all rules and regulations of the library.
          </span>
        </label>
        
        <label className="flex items-start gap-4 cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-bg dark:hover:bg-bg-dark transition-colors">
          <input 
            type="checkbox" 
            checked={termsAccepted.damage}
            onChange={(e) => setTermsAccepted({...termsAccepted, damage: e.target.checked})}
            className="mt-1 w-5 h-5 rounded border-2 border-card-border text-blue-accent focus:ring-blue-accent accent-blue-accent cursor-pointer" 
          />
          <span className="text-[13px] font-medium leading-relaxed text-text-primary dark:text-text-primary-dark group-hover:text-blue-accent transition-colors pt-0.5">
            I will be held responsible for any damage caused by me and agree to pay for the same.
          </span>
        </label>
        
        <label className="flex items-start gap-4 cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-bg dark:hover:bg-bg-dark transition-colors">
          <input 
            type="checkbox" 
            checked={termsAccepted.nonRefundable}
            onChange={(e) => setTermsAccepted({...termsAccepted, nonRefundable: e.target.checked})}
            className="mt-1 w-5 h-5 rounded border-2 border-card-border text-blue-accent focus:ring-blue-accent accent-blue-accent cursor-pointer" 
          />
          <span className="text-[13px] font-medium leading-relaxed text-text-primary dark:text-text-primary-dark group-hover:text-blue-accent transition-colors pt-0.5">
            Membership is Non-refundable and Non-transferable.
          </span>
        </label>
      </div>

      {/* Submit */}
      <div className="flex gap-4 pb-8">
        <button
          type="submit"
          disabled={vacantSeats.length === 0 || !allTermsAccepted}
          className="flex-1 rounded-xl bg-blue-accent py-4 text-[13px] font-black tracking-widest uppercase text-white hover:bg-blue-accent/90 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:bg-card-border disabled:text-text-secondary disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-accent/30 active:scale-[0.98]"
        >
          Submit Form
        </button>
        <button
          type="button"
          onClick={clearForm}
          className="rounded-xl border border-card-border dark:border-card-border-dark px-6 text-[13px] font-black uppercase text-text-secondary dark:text-text-secondary-dark hover:bg-bg dark:hover:bg-bg-dark hover:text-red-500 transition-colors cursor-pointer"
        >
          Clear Form
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
      <label className="block text-xs font-black uppercase tracking-wider text-text-secondary dark:text-text-secondary-dark mb-2.5">
        {label}
        {required && <span className="text-red-500 ml-1 text-sm leading-none">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-2 text-[11px] font-bold text-red-500 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500 inline-block"></span>
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
    <div className="flex gap-1.5 bg-bg dark:bg-bg-dark p-1.5 rounded-xl border border-card-border dark:border-card-border-dark inline-flex w-full">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-200 cursor-pointer',
            value === opt.value
              ? 'bg-blue-accent text-white shadow-md scale-100 ring-1 ring-blue-accent/50'
              : 'text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark hover:bg-surface dark:hover:bg-surface-dark scale-[0.98]',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
