'use client';

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { attachOnlineSyncListener } from '@/lib/sync/backgroundSync';

// ─── TanStack Query Client ────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutes for advisory data, overridden per-query where needed
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0, // Mutations should not auto-retry — offline sync handles it
    },
  },
});

// ─── Language & RTL Provider ───────────────────────────────────────────────────

function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useAppStore((s) => s.language);
  const setOffline = useAppStore((s) => s.setOffline);
  const session = useAuthStore((s) => s.session);

  // Sync html[lang] and html[dir] with language preference
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', language);
    html.setAttribute('dir', language === 'ur' ? 'rtl' : 'ltr');

    // Apply Urdu font to html element for global Noto Serif inheritance
    if (language === 'ur') {
      html.classList.add('font-serif');
      html.classList.remove('font-sans');
    } else {
      html.classList.add('font-sans');
      html.classList.remove('font-serif');
    }
  }, [language]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    setOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOffline]);

  // Attach background sync listener once session is available
  useEffect(() => {
    attachOnlineSyncListener(
      () => session?.accessToken ?? null,
      (result) => {
        if (result.synced > 0) {
          console.info(`[Sync] ${result.synced} scans synced to cloud`);
        }
      }
    );
  }, [session]);

  return <>{children}</>;
}

// ─── Root Providers ────────────────────────────────────────────────────────────

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>{children}</LanguageProvider>
    </QueryClientProvider>
  );
}
