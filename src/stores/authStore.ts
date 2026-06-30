'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Auth State Shape ─────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  phone: string | null;
  isAnonymous: boolean;
}

interface AuthSession {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isAnonymous: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setSession: (session: AuthSession | null) => void;
  setAnonymous: (userId: string) => void;
  clearSession: () => void;
  setLoading: (isLoading: boolean) => void;
  setInitialized: () => void;
}

type AuthStore = AuthState & AuthActions;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      session: null,
      isAnonymous: true,
      isLoading: true,
      isInitialized: false,

      // Actions
      setUser: (user) =>
        set({
          user,
          isAnonymous: user?.isAnonymous ?? true,
        }),

      setSession: (session) => set({ session }),

      setAnonymous: (userId) =>
        set({
          user: { id: userId, phone: null, isAnonymous: true },
          isAnonymous: true,
        }),

      clearSession: () =>
        set({
          user: null,
          session: null,
          isAnonymous: true,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setInitialized: () => set({ isInitialized: true, isLoading: false }),
    }),
    {
      name: 'fasalguard-auth',
      storage: createJSONStorage(() => localStorage),
      // Persist user and session for cross-reload auth
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAnonymous: state.isAnonymous,
      }),
    }
  )
);
