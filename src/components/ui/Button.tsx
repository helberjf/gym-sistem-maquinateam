import { Slot } from '@radix-ui/react-slot';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline-dark';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  asChild?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-red hover:bg-brand-red-dark text-black border-transparent',
  secondary:
    'bg-transparent hover:bg-brand-gray-mid text-brand-white border-brand-gray-mid',
  ghost:
    'bg-transparent hover:bg-brand-gray-mid text-brand-gray-light hover:text-brand-white border-transparent',
  danger:
    'bg-brand-gray-mid hover:bg-brand-gray-light/30 text-white border-transparent',
  'outline-dark':
    'bg-transparent hover:bg-black/5 text-black border-black/15',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      asChild = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;
    const content = asChild ? (
      children
    ) : (
      <>
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </>
    );

    return (
      <Comp
        ref={ref}
        className={[
          'inline-flex items-center justify-center gap-2 rounded-lg border font-medium',
          'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-brand-red disabled:opacity-50 disabled:cursor-not-allowed',
          'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        aria-disabled={isDisabled || undefined}
        data-disabled={isDisabled ? '' : undefined}
        disabled={asChild ? undefined : isDisabled}
        {...props}
      >
        {content}
      </Comp>
    );
  }
);

Button.displayName = 'Button';
