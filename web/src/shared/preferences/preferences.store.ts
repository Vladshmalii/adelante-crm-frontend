import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

interface PreferencesState {
  themeMode: ThemeMode;
  siderCollapsed: boolean;
  toggleTheme: () => void;
  setSiderCollapsed: (collapsed: boolean) => void;
}

/** Локальные UI-настройки пользователя (переживают перезагрузку). */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      // По умолчанию — тёмная тема; выбор пользователя сохраняется в браузере.
      themeMode: 'dark',
      siderCollapsed: false,
      toggleTheme: () => {
        set((s) => ({ themeMode: s.themeMode === 'light' ? 'dark' : 'light' }));
      },
      setSiderCollapsed: (siderCollapsed) => {
        set({ siderCollapsed });
      },
    }),
    { name: 'adelante.preferences' },
  ),
);
