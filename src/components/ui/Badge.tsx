'use client';

import React from 'react';
import type { DiseaseSeverity } from '@/types/api';

// ─── Badge Props ──────────────────────────────────────────────────────────────

export type BadgeVariant = DiseaseSeverity | 'default' | 'info' | 'open' | 'closed';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

// ─── Variant Styles ───────────────────────────────────────────────────────────
// All variants enforce 7:1 contrast ratio per design.json doNot rules

const variantStyles: Record<BadgeVariant, string> = {
  // Severity variants (from schema.sql disease_severity enum)
  healthy: 'bg-success-subtle text-success-text border border-success-border',
  low: 'bg-success-subtle text-success-text border border-success-border',
  moderate: 'bg-warning-subtle text-warning-text border border-warning-border',
  high: 'bg-error-subtle text-error-hover border border-error-border',
  urgent:
    'bg-error text-error-text border border-error font-semibold',

  // Generic variants
  default: 'bg-bg-secondary text-text-secondary border border-border-default',
  info: 'bg-info-subtle text-info-text border border-border-default',

  // Dealer status
  open: 'bg-success-subtle text-success-text border border-success-border',
  closed: 'bg-bg-secondary text-text-tertiary border border-border-default',
};

// ─── Severity Dot Color ────────────────────────────────────────────────────────

const dotColor: Partial<Record<BadgeVariant, string>> = {
  healthy: 'bg-success-DEFAULT',
  low: 'bg-success-DEFAULT',
  moderate: 'bg-warning-DEFAULT',
  high: 'bg-error-DEFAULT',
  urgent: 'bg-white',
  open: 'bg-success-DEFAULT',
  closed: 'bg-text-tertiary',
};

// ─── Badge Component ──────────────────────────────────────────────────────────

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
  pulse = false,
}) => {
  const showDot = variant in dotColor;

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1',
        'text-xs font-semibold rounded-full',
        'transition-colors duration-fast',
        variantStyles[variant],
        pulse && variant === 'urgent' ? 'animate-pulse' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showDot && (
        <span
          className={[
            'h-1.5 w-1.5 rounded-full flex-shrink-0',
            dotColor[variant] ?? 'bg-current',
          ].join(' ')}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};

// ─── SeverityBadge (convenience wrapper) ─────────────────────────────────────

export interface SeverityBadgeProps {
  severity: DiseaseSeverity;
  label?: string; // Override display text (defaults to severity name)
  className?: string;
}

const severityLabels: Record<DiseaseSeverity, { en: string; ur: string }> = {
  healthy: { en: 'Healthy', ur: 'صحت مند' },
  low: { en: 'Low Risk', ur: 'کم خطرہ' },
  moderate: { en: 'Moderate', ur: 'متوسط' },
  high: { en: 'High', ur: 'زیادہ' },
  urgent: { en: 'URGENT', ur: 'فوری' },
};

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  label,
  className,
}) => {
  return (
    <Badge
      variant={severity}
      pulse={severity === 'urgent'}
      className={className}
    >
      {label ?? severityLabels[severity].en}
    </Badge>
  );
};
