import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

    const variants = {
      primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm active:bg-slate-950',
      secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300',
      outline:
        'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs',
      ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      destructive:
        'bg-rose-600 text-white hover:bg-rose-700 shadow-sm active:bg-rose-800 focus-visible:ring-rose-600',
      link: 'text-slate-900 underline-offset-4 hover:underline p-0 h-auto font-normal',
    };

    const sizes = {
      sm: 'h-8 px-2.5 text-xs gap-1.5',
      md: 'h-9 px-3.5 text-sm gap-2',
      lg: 'h-10 px-4 text-sm gap-2 font-semibold',
      icon: 'h-8 w-8 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
