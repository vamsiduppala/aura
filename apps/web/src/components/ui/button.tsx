import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// shadcn-style Button, variants styled to the aura design tokens (docs/DESIGN_SYSTEM.md).
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-grotesk font-semibold transition-transform active:translate-y-px disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-b from-white to-[#E4E0F0] text-[#0B0912] shadow-[0_8px_30px_-12px_rgba(174,143,230,0.6)]',
        ghost: 'bg-transparent text-mist-2 font-sans font-normal shadow-none',
        outline: 'bg-white/5 border border-line-2 text-mist',
        danger: 'bg-transparent border border-forge/40 text-forge shadow-none',
      },
      size: {
        default: 'h-14 w-full rounded-[18px] text-[14.5px]',
        sm: 'h-11 rounded-[15px] px-5 text-[13px]',
        pill: 'h-12 rounded-[15px] px-6 text-[13px]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = 'Button';
