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

// Content IS the panel (full-screen sheet on mobile, centered card on desktop). The
// overlay sits behind it so an outside click (desktop) closes — Radix handles ESC too.
export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-[rgba(6,5,12,0.62)] backdrop-blur-[4px]" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-[80] flex flex-col overflow-hidden bg-gradient-to-b from-[#0C0A16] to-[#0A0812] outline-none',
        'inset-0',
        'md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-[660px] md:max-h-[88vh] md:rounded-[22px] md:border md:border-line-2 md:shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)]',
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = 'DialogContent';
