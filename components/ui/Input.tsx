import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className={cn("input-wrapper w-full", className)}>
        <input
          ref={ref}
          placeholder=" " // necessary for the :placeholder-shown to trigger properly
          className={cn(
            "input-field peer w-full",
            error && "is-error"
          )}
          {...props}
        />
        <label className="input-label">
          {label}
        </label>
        <AnimatePresence>
          {(error || helperText) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn("input-helper", error ? "is-error" : "")}
            >
              {error || helperText}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
Input.displayName = 'Input';

// For backwards compatibility until refactored
export const FloatingLabelInput = Input;
