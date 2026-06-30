'use client';

import React from 'react';

// ─── Card Props ────────────────────────────────────────────────────────────────

type CardVariant = 'default' | 'treatmentInfo' | 'flat' | 'ghost';

export interface CardProps {
  variant?: CardVariant;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export interface CardBodyProps {
  className?: string;
  children: React.ReactNode;
}

export interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

// ─── Variant Styles ───────────────────────────────────────────────────────────

const variantStyles: Record<CardVariant, string> = {
  default:
    'bg-bg-tertiary border border-border-subtle shadow-card-lift',
  treatmentInfo:
    'bg-success-subtle border border-success-border',
  flat:
    'bg-bg-primary border border-border-subtle shadow-none',
  ghost:
    'bg-transparent border border-dashed border-border-strong',
};

// ─── Card Component ────────────────────────────────────────────────────────────

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  className = '',
  children,
  onClick,
}) => {
  const isInteractive = !!onClick;

  return (
    <div
      className={[
        'rounded-2xl overflow-hidden',
        variantStyles[variant],
        isInteractive
          ? 'cursor-pointer transition-all duration-fast hover:shadow-modal-priority active:scale-[0.99]'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({
  className = '',
  children,
}) => (
  <div className={['px-4 pt-4 pb-2', className].join(' ')}>{children}</div>
);

export const CardBody: React.FC<CardBodyProps> = ({
  className = '',
  children,
}) => (
  <div className={['px-4 py-3', className].join(' ')}>{children}</div>
);

export const CardFooter: React.FC<CardFooterProps> = ({
  className = '',
  children,
}) => (
  <div
    className={[
      'px-4 pb-4 pt-2 border-t border-border-subtle',
      className,
    ].join(' ')}
  >
    {children}
  </div>
);
