'use client';

import React from 'react';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="app" id="app">
      {children}
    </div>
  );
};
