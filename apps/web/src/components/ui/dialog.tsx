import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

// shadcn-style Dialog on Radix: focus trap, ESC-to-close, ARIA, scroll-lock — the
// accessibility win. Visuals match the aura expanded-reading modal.
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

// Content IS the panel — full-screen sheet on mobile, centered card on desktop.
// Positioning uses an explicit `.dialog-panel` class (styles.css) rather than fragile
// utility-composed transforms, so it reliably centers instead of drifting to a corner.
export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="dialog-overlay" />
    <DialogPrimitive.Content ref={ref} className={cn('dialog-panel', className)} {...props}>
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = 'DialogContent';
