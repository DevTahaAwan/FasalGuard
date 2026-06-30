'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

// ─── ErrorBanner Props ─────────────────────────────────────────────────────────

export interface ErrorBannerProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  variant?: 'banner' | 'fullscreen';
}

// ─── ErrorBanner Component ────────────────────────────────────────────────────

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  title,
  message,
  onRetry,
  retryLabel = 'Retry',
  className = '',
  variant = 'banner',
}) => {
  if (variant === 'fullscreen') {
    return (
      <div
        className={[
          'flex flex-col items-center justify-center text-center px-6 py-12 min-h-[320px]',
          className,
        ].join(' ')}
        role="alert"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-subtle mb-4">
          <AlertCircle className="h-8 w-8 text-error" aria-hidden="true" />
        </div>

        {title && (
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            {title}
          </h2>
        )}

        <p className="text-sm text-text-secondary max-w-xs leading-relaxed mb-6">
          {message}
        </p>

        {onRetry && (
          <Button
            variant="primary"
            size="lg"
            onClick={onRetry}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={[
        'flex items-start gap-3 p-4 rounded-xl',
        'bg-error-subtle border border-error-border',
        className,
      ].join(' ')}
      role="alert"
    >
      <AlertCircle
        className="h-5 w-5 text-error flex-shrink-0 mt-0.5"
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-semibold text-warning-text mb-1">{title}</p>
        )}
        <p className="text-sm text-warning-text leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="flex-shrink-0 text-warning-text hover:text-warning-text/80"
          aria-label={retryLabel}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
