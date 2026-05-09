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
              ? 'border-[var(--ruby-500)] focus:border-[var(--ruby-400)] focus:ring-4 focus:ring-[var(--ruby-glow)]' 
              : 'border-[var(--border-default)] hover:border-[var(--border-strong)] focus:border-[var(--border-glow)] focus:bg-[var(--bg-elevated)] focus:ring-4 focus:ring-[rgba(232,133,58,0.15)]',
            className
          )}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          placeholder={label} // peer-placeholder-shown trick
          {...props}
        />
        
        <label
          className={cn(
            'pointer-events-none absolute left-4 transition-all duration-300 transform font-medium select-none z-10',
            !!icon && 'left-11',
            props.type === 'date'
              ? 'top-2 text-[11px] font-bold text-[var(--saffron-400)]' // Date input always elevated
              : 'top-1/2 -translate-y-1/2 text-sm text-[var(--text-tertiary)] peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-[11px] peer-focus:font-bold peer-focus:text-[var(--saffron-400)] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:-translate-y-0 peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:text-[var(--text-tertiary)]'
          )}
        >
          {label}
        </label>

        {error && (
          <motion.span 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-5 left-1 text-[11px] font-bold text-[var(--ruby-400)] tracking-wide"
          >
            {error}
          </motion.span>
        )}
      </div>
    );
  }
);
FloatingLabelInput.displayName = 'FloatingLabelInput';
