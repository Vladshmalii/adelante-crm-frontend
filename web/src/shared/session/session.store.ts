import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  /** Активный салон — уходит в заголовке X-Salon-Id. */
  salonId: string | null;
  setTokens: (tokens: Tokens) => void;
  setSalonId: (salonId: string) => void;
  clear: () => void;
}

/**
 * Токены и активный салон. Серверные данные (профиль, салоны) сюда не кладём —
 * они живут в TanStack Query (см. shared/auth).
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      salonId: null,
      setTokens: ({ accessToken, refreshToken }) => {
        set({ accessToken, refreshToken });
      },
      setSalonId: (salonId) => {
        set({ salonId });
      },
      clear: () => {
        set({ accessToken: null, refreshToken: null, salonId: null });
      },
    }),
    {
      name: 'adelante.session',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ accessToken, refreshToken, salonId }) => ({
        accessToken,
        refreshToken,
        salonId,
      }),
    },
  ),
);

export const isAuthenticated = () => useSessionStore.getState().accessToken !== null;
