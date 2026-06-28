import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border text-[12px] font-medium tracking-[-0.01em] shadow-none transition-[background,border-color,color,opacity,filter,transform,box-shadow] duration-150 outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.985] [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'cb-neutral-primary',
        destructive: 'cb-menu-button-danger',
        outline: 'cb-menu-button-quiet',
        secondary: 'cb-menu-button-secondary',
        ghost: 'border-transparent bg-transparent text-muted-foreground hover:bg-foreground/[0.045] hover:text-foreground dark:hover:bg-white/[0.055]',
        link: 'h-auto rounded-none border-0 bg-transparent p-0 text-muted-foreground shadow-none hover:text-foreground hover:underline',
      },
      size: {
        default: 'h-8 px-3',
        sm: 'h-8 rounded-[9px] px-3 text-[12px]',
        lg: 'h-9 rounded-[10px] px-4 text-[12.5px]',
        icon: 'size-8 rounded-[9px] p-0',
        'icon-sm': 'size-8 rounded-[9px] p-0',
        'icon-lg': 'size-9 rounded-[10px] p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
