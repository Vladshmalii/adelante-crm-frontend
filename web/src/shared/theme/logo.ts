import { type ThemeMode, usePreferencesStore } from '@/shared/preferences';

/**
 * Логотип салона: рисунок тёмный на прозрачном фоне — в тёмной теме нужна светлая версия.
 * Исходник (8268×8268) — `web/brand/logo-source.png`, в `public/` — уменьшенные копии.
 */
export const logoFor = (mode: ThemeMode) => (mode === 'dark' ? '/logo-light.png' : '/logo.png');

/** Логотип под текущую тему. */
export const useLogo = () => logoFor(usePreferencesStore((s) => s.themeMode));
