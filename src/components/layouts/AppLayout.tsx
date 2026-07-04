'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { theme } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeClass = mounted ? `theme-${theme}` : 'theme-light';

  return (
    <div className={`app ${themeClass}`} id="app">
      {children}
    </div>
  );
};
