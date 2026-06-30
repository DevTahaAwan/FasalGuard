'use client';

import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { Button } from './Button';

// ─── EmptyState Props ─────────────────────────────────────────────────────────

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  className?: string;
}

// ─── EmptyState Component ─────────────────────────────────────────────────────

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCtaClick,
  className = '',
}) => {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center px-8 py-12',
        'min-h-[240px]',
        className,
      ].join(' ')}
    >
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-secondary mb-4">
        <Icon className="h-8 w-8 text-text-tertiary" aria-hidden="true" />
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-text-primary mb-2">{title}</h2>

      {/* Description */}
      {description && (
        <p className="text-sm text-text-secondary max-w-xs leading-relaxed mb-6">
          {description}
        </p>
      )}

      {/* CTA */}
      {ctaLabel && onCtaClick && (
        <Button variant="primary" size="lg" onClick={onCtaClick}>
          {ctaLabel}
        </Button>
      )}
    </div>
  );
};
