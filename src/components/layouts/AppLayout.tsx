'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { theme, language } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const isRTL = language === 'ur';

  useEffect(() => {
    setMounted(true);
    window.addEventListener('offline', () => setIsOffline(true));
    window.addEventListener('online', () => setIsOffline(false));
  }, []);

  const themeClass = mounted ? `theme-${theme}` : 'theme-light';

  return (
    <div className={`app ${themeClass}`} id="app">
      {isOffline && (
        <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center p-3 z-50 font-bold shadow-md">
          {isRTL ? 'انٹرنیٹ کنکشن نہیں ہے' : 'No Internet Connection'}
        </div>
      )}
      {children}
    </div>
  );
};
