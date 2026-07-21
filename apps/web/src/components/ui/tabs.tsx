import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

// shadcn-style Tabs on Radix (keyboard + ARIA for free), styled to the aura tokens.
export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn('flex border-b border-line', className)} {...props} />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative flex-1 cursor-pointer border-none bg-transparent py-3 font-grotesk text-[13px] font-medium text-mist-3 outline-none transition-colors',
      'data-[state=active]:text-mist',
      'after:absolute after:-bottom-px after:left-[22%] after:right-[22%] after:h-0.5 after:rounded after:bg-smoke after:opacity-0 after:shadow-[0_0_10px_-1px_var(--smoke)] data-[state=active]:after:opacity-100',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = TabsPrimitive.Content;
