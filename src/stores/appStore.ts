'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Language } from '@/types/api';

export type ThemeType = 'light' | 'dark' | 'sunlight';

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AppState {
  // Language & i18n
  language: Language;
  // Connectivity
  isOffline: boolean;
  // Scan state (prevents double-scans)
  scanInProgress: boolean;
  // Selected crops for home dashboard (slugs)
  selectedCropSlugs: string[];
  // PWA install prompt event (stored for showing install UI)
  pwaInstallPromptAvailable: boolean;
  // App Theme
  theme: ThemeType;
}

interface AppActions {
  setLanguage: (language: Language) => void;
  setOffline: (isOffline: boolean) => void;
  setScanInProgress: (inProgress: boolean) => void;
  setSelectedCropSlugs: (slugs: string[]) => void;
  addCropSlug: (slug: string) => void;
  removeCropSlug: (slug: string) => void;
  setPwaInstallPromptAvailable: (available: boolean) => void;
  setTheme: (theme: ThemeType) => void;
}

type AppStore = AppState & AppActions;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Initial state
      language: 'ur', // Default Urdu per PRD target market
      isOffline: false,
      scanInProgress: false,
      selectedCropSlugs: [],
      pwaInstallPromptAvailable: false,
      theme: 'light',

      // Actions
      setLanguage: (language) => set({ language }),
      setOffline: (isOffline) => set({ isOffline }),
      setScanInProgress: (scanInProgress) => set({ scanInProgress }),
      setSelectedCropSlugs: (selectedCropSlugs) => set({ selectedCropSlugs }),
      addCropSlug: (slug) =>
        set((state) => ({
          selectedCropSlugs: state.selectedCropSlugs.includes(slug)
            ? state.selectedCropSlugs
            : [...state.selectedCropSlugs, slug],
        })),
      removeCropSlug: (slug) =>
        set((state) => ({
          selectedCropSlugs: state.selectedCropSlugs.filter((s) => s !== slug),
        })),
      setPwaInstallPromptAvailable: (pwaInstallPromptAvailable) =>
        set({ pwaInstallPromptAvailable }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'fasalguard-app',
      storage: createJSONStorage(() => localStorage),
      // Only persist language, crop selections, and theme — not transient UI state
      partialize: (state) => ({
        language: state.language,
        selectedCropSlugs: state.selectedCropSlugs,
        theme: state.theme,
      }),
    }
  )
);
