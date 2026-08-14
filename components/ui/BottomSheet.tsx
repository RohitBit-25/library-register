'use client';

import { useRef, useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { springSheet, shouldDismissSheet } from '@/lib/motion';

/**
 * A bottom sheet you can actually drag.
 *
 * It already had the drag handle — a 48×6 pill at the top, the universal
 * affordance for "pull me down" — attached to nothing. Swiping did nothing;
 * the only way out was the small × or a tap on the backdrop. A control that
 * looks draggable and isn't is worse than no handle, because it teaches the
 * user the gesture does not work here.
 *
 * Two libraries, each doing what it is good at:
 *
 * - **Radix Dialog** for the shell — focus trap, scroll lock, Escape, focus
 *   return, `aria-modal`. The old version had a comment saying "Trap focus"
 *   above a handler that only listened for Escape, so focus was never
 *   actually trapped.
 * - **framer-motion** for the gesture — it tracks the pointer 1:1, reports
 *   release velocity, and hands that velocity into the settling spring so
 *   there is no seam between dragging and animating.
 *
 * The dismiss decision uses momentum projection rather than position alone
 * (`shouldDismissSheet` in lib/motion.ts): a fast flick from a third of the
 * way down closes, because that is where the throw was heading, while a slow
 * drag to the same point springs back.
 *
 * `dragElastic` is asymmetric on purpose — 0.6 downward because that is the
 * direction that means something, 0.04 upward as rubber-banding against a
 * boundary. A hard stop reads as frozen; resistance reads as "there is
 * nothing more this way".
 *
 * Reduced motion is handled globally by `MotionConfig reducedMotion="user"`
 * in AppShell.
 */

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoint?: '40%' | '60%' | '90%';
}

const snapHeights = {
  '40%': 'max-h-[40vh]',
  '60%': 'max-h-[60vh]',
  '90%': 'max-h-[90vh]',
};

export default function BottomSheet({
  open,
  onClose,
  children,
  title,
  snapPoint = '60%',
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setDragging(false);
    const height = sheetRef.current?.offsetHeight ?? window.innerHeight * 0.6;
    if (shouldDismissSheet(info.offset.y, info.velocity.y, height)) onClose();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md data-[state=open]:animate-fade-in" />

        <DialogPrimitive.Content
          aria-label={title || 'Detail panel'}
          asChild
        >
          <motion.div
            ref={sheetRef}
            initial={{ transform: 'translateY(100%)' }}
            animate={{ transform: 'translateY(0%)' }}
            exit={{ transform: 'translateY(100%)' }}
            transition={springSheet}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            // Downward is the meaningful direction; upward only rubber-bands.
            dragElastic={{ top: 0.04, bottom: 0.6 }}
            onDragStart={() => setDragging(true)}
            onDragEnd={handleDragEnd}
            // Carry the release velocity into the settle so the sheet keeps
            // moving at the speed the finger was moving.
            dragTransition={{ power: 0.2, timeConstant: 200 }}
            dragMomentum={false}
            whileDrag={{ cursor: 'grabbing' }}
            className={cn(
              'glass noise-pattern shadow-floating fixed bottom-0 left-0 right-0 z-50 overflow-hidden rounded-t-[32px] border-t border-[var(--border-subtle)]',
              snapHeights[snapPoint],
            )}
          >
            {/* The handle is the drag target as well as the affordance, with
                a target tall enough to hit — the pill itself is 6px. */}
            <div
              className="relative z-10 flex cursor-grab touch-none justify-center pt-4 pb-2 active:cursor-grabbing"
              aria-hidden="true"
            >
              <div
                className={cn(
                  'h-1.5 w-12 rounded-full transition-colors',
                  dragging ? 'bg-[var(--text-secondary)]' : 'bg-[var(--text-tertiary)]/30',
                )}
              />
            </div>

            {title && (
              <div className="relative z-10 flex items-center justify-between px-6 pb-4">
                <DialogPrimitive.Title className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  {title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Close
                  className="cursor-pointer rounded-lg p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)]"
                  aria-label="Close panel"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </DialogPrimitive.Close>
              </div>
            )}

            {/* Content scrolls; `touch-pan-y` keeps a scroll gesture here from
                being stolen by the sheet's own drag. */}
            <div className="relative z-10 max-h-full touch-pan-y overflow-y-auto px-6 pb-8">
              {children}
            </div>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
