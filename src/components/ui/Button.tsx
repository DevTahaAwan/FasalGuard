'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

// ─── Button Props ─────────────────────────────────────────────────────────────

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'whatsapp'
  | 'destructive'
  | 'link';

type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

// ─── Variant Styles ───────────────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-primary text-text-inverse hover:bg-brand-hover active:bg-brand-active focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:bg-border-default disabled:text-text-disabled disabled:cursor-not-allowed',
  secondary:
    'bg-bg-secondary text-text-primary border border-border-default hover:bg-bg-primary active:bg-border-subtle focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'bg-transparent text-brand-primary hover:bg-brand-subtle active:bg-brand-subtle/70 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  whatsapp:
    'bg-whatsapp text-white hover:bg-whatsapp-hover active:bg-whatsapp-hover/90 focus-visible:ring-2 focus-visible:ring-whatsapp focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  destructive:
    'bg-error text-error-text hover:bg-error-hover active:bg-error-hover/90 focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  link: 'bg-transparent text-text-link hover:text-text-linkHover underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed p-0 h-auto min-h-0',
};

// ─── Size Styles ──────────────────────────────────────────────────────────────

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-sm rounded-lg gap-1.5 min-h-touch-secondary',
  md: 'h-12 px-5 text-base rounded-xl gap-2 min-h-touch-secondary',
  lg: 'h-14 px-6 text-base font-semibold rounded-xl gap-2.5 min-h-touch-primary',
};

// ─── Button Component ─────────────────────────────────────────────────────────

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          // Base styles
          'inline-flex items-center justify-center font-sans transition-all duration-fast',
          'select-none outline-none',
          // Variant
          variantStyles[variant],
          // Size
          sizeStyles[size],
          // Full width
          fullWidth ? 'w-full' : '',
          // Custom classes
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon && (
            <span className="me-1 flex-shrink-0" aria-hidden="true">
              {leftIcon}
            </span>
          )
        )}

        {children}

        {!isLoading && rightIcon && (
          <span className="ms-1 flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
