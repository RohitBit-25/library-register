'use client';

import { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * Destructive confirmation.
 *
 * The props are unchanged from the hand-rolled version, so all seven call
 * sites stayed untouched — only the body moved onto Radix's AlertDialog.
 *
 * What that buys, none of which the previous implementation had in full:
 *
 * - A real focus trap. Before, Tab walked straight out of the dialog and into
 *   the page behind it, so a keyboard user could focus — and activate — the
 *   very button they had just been asked to confirm away from.
 * - Focus returns to whatever opened it on close.
 * - Scroll lock that survives nested dialogs; the old one wrote
 *   `document.body.style.overflow` directly, so two dialogs closing in
 *   sequence left the page unscrollable.
 * - `role="alertdialog"` with the title and description wired by the
 *   primitive, rather than by hand-generated ids.
 * - Escape, outside-click and the animation states handled together, instead
 *   of a keydown listener bolted on beside an AnimatePresence.
 *
 * `AlertDialogAction` deliberately does **not** auto-close: this component's
 * contract is that confirming runs `onConfirm` and then closes, and callers
 * rely on that ordering.
 *
 * Focus return is handled here rather than by Radix. Radix restores focus to
 * its `AlertDialogTrigger`, and this dialog has none — every caller opens it
 * from state, so on close focus fell to `<body>` and a keyboard user was
 * dropped back at the top of the document. The trigger is captured when the
 * dialog opens and focused again on the way out.
 */
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}: ConfirmDialogProps) {
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) openerRef.current = document.activeElement as HTMLElement | null;
  }, [isOpen]);

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent
        className="max-w-sm"
        onCloseAutoFocus={(e) => {
          // Only take over when the opener is still on the page — after a
          // vacate the row it lived in is gone, and forcing focus onto a
          // detached node would strand it.
          const opener = openerRef.current;
          if (opener && opener.isConnected) {
            e.preventDefault();
            opener.focus();
          }
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className={
              variant === 'danger'
                ? 'shrink-0 rounded-full bg-[var(--ruby-50)] p-2 text-[var(--ruby-600)]'
                : 'shrink-0 rounded-full bg-[var(--saffron-50)] p-2 text-[var(--saffron-700)]'
            }
          >
            <AlertCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <AlertDialogTitle className="text-lg font-bold text-[var(--text-primary)]">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
              {description}
            </AlertDialogDescription>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => { onConfirm(); onClose(); }}
            className={
              variant === 'danger'
                ? 'bg-[var(--ruby-600)] hover:bg-[var(--ruby-700)]'
                : undefined
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
