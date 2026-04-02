import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface FloatingLabelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);
    
    // Check if input has value (even unmanaged from ref)
    const hasValue = props.value !== undefined && props.value !== '' || props.defaultValue !== undefined && props.defaultValue !== '';
    const active = focused || hasValue;

    return (
      <div className="relative w-full group">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] z-20 pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          className={cn(
            'peer w-full rounded-xl border bg-[var(--bg-muted)] px-4 pt-6 pb-2 text-base font-medium text-[var(--text-primary)] placeholder-transparent shadow-sm outline-none transition-all duration-300 backdrop-blur-md',
            !!icon && 'pl-11',
            error 
              ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
              : 'border-[var(--border-default)] hover:border-[var(--border-strong)] focus:border-[var(--sapphire-500)]/50 focus:bg-[var(--bg-muted)] focus:ring-4 focus:ring-[var(--sapphire-500)]/10',
            className
          )}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          placeholder={label} // peer-placeholder-shown trick
          {...props}
        />
        
        <label
          className={cn(
            'pointer-events-none absolute left-4 text-[var(--text-tertiary)] transition-all duration-300 transform font-medium select-none z-10',
            !!icon && 'left-11',
            active
              ? 'top-2 text-[11px] font-bold text-[var(--sapphire-500)]'
              : 'top-1/2 -translate-y-1/2 text-sm'
          )}
        >
          {label}
        </label>

        {error && (
          <motion.span 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-5 left-1 text-[11px] font-bold text-red-500 tracking-wide"
          >
            {error}
          </motion.span>
        )}
      </div>
    );
  }
);
FloatingLabelInput.displayName = 'FloatingLabelInput';
