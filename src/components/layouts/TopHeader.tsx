'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/Button';

// ─── TopHeader Props ──────────────────────────────────────────────────────────

export interface TopHeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  backHref?: string;
  title?: string;
  rightSlot?: React.ReactNode;
  transparent?: boolean;
}

// ─── TopHeader Component ──────────────────────────────────────────────────────

export const TopHeader: React.FC<TopHeaderProps> = ({
  showBack = false,
  onBack,
  backHref,
  title,
  rightSlot,
  transparent = false,
}) => {
  const { language, setLanguage } = useAppStore();
  const isRTL = language === 'ur';

  // RTL: back arrow flips direction
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <header
      className={[
        'fixed top-0 start-0 end-0 z-40 h-header-height',
        'flex items-center px-4 gap-2',
        transparent
          ? 'bg-transparent'
          : 'bg-bg-primary border-b border-border-subtle',
        'max-w-content mx-auto',
      ].join(' ')}
    >
      {/* Back button / Logo area */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {showBack ? (
          backHref ? (
            <Link
              href={backHref}
              aria-label={isRTL ? 'واپس' : 'Back'}
              className="flex items-center justify-center h-10 w-10 rounded-xl hover:bg-bg-secondary transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-brand-primary outline-none flex-shrink-0"
            >
              <BackIcon className="h-5 w-5 text-text-primary" aria-hidden="true" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onBack}
              aria-label={isRTL ? 'واپس' : 'Back'}
              className="flex items-center justify-center h-10 w-10 rounded-xl hover:bg-bg-secondary transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-brand-primary outline-none flex-shrink-0"
            >
              <BackIcon className="h-5 w-5 text-text-primary" aria-hidden="true" />
            </button>
          )
        ) : (
          /* Logo / App name */
          <Link
            href="/home"
            className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-lg"
            aria-label="FasalGuard — Home"
          >
            {/* Leaf emoji as quick logo placeholder */}
            <span className="text-2xl" aria-hidden="true">🌿</span>
            <span
              className={[
                'text-lg font-bold text-brand-primary truncate',
                isRTL ? 'font-serif' : 'font-sans',
              ].join(' ')}
            >
              {isRTL ? 'فصل گارڈ' : 'FasalGuard'}
            </span>
          </Link>
        )}

        {/* Center title (when back button is shown) */}
        {showBack && title && (
          <h1
            className={[
              'text-base font-semibold text-text-primary truncate',
              isRTL ? 'font-serif' : 'font-sans',
            ].join(' ')}
          >
            {title}
          </h1>
        )}
      </div>

      {/* Right slot (custom) */}
      {rightSlot && (
        <div className="flex items-center gap-2 flex-shrink-0">{rightSlot}</div>
      )}

      {/* Language Toggle */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setLanguage(isRTL ? 'en' : 'ur')}
        aria-label={isRTL ? 'Switch to English' : 'اردو میں تبدیل کریں'}
        className="flex-shrink-0 text-xs"
      >
        {isRTL ? 'EN' : 'اردو'}
      </Button>
    </header>
  );
};
