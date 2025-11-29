import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const accessibleButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90 active:scale-95',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-95',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:scale-95',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:scale-95',
        ghost: 'hover:bg-accent hover:text-accent-foreground active:scale-95',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-md px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof accessibleButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(accessibleButtonVariants({ variant, size, className }))}
        ref={ref}
        aria-busy={loading}
        aria-disabled={props.disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span>
            <span className="sr-only">Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
AccessibleButton.displayName = 'AccessibleButton';

export { AccessibleButton, accessibleButtonVariants };
