'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { AppLayout } from '@/components/layouts/AppLayout';
import { ErrorBanner } from '@/components/ui/ErrorBanner';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { language } = useAppStore();
  const isRTL = language === 'ur';

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App Error:', error);
  }, [error]);

  return (
    <AppLayout>
      <div className="p-6 h-full flex flex-col items-center justify-center">
        <ErrorBanner 
          variant="fullscreen"
          title={isRTL ? 'کچھ غلط ہو گیا' : 'Something went wrong'}
          message={error.message || (isRTL ? 'براہ کرم دوبارہ کوشش کریں۔' : 'Please try again.')}
          onRetry={reset}
          retryLabel={isRTL ? 'دوبارہ کوشش کریں' : 'Try Again'}
        />
      </div>
    </AppLayout>
  );
}
