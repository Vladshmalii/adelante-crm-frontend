import { theme, type ThemeConfig } from 'antd';

import type { ThemeMode } from '@/shared/preferences';

/** Единая точка кастомизации дизайна: токены antd вместо собственных CSS-переменных. */
export const getTheme = (mode: ThemeMode): ThemeConfig => ({
  algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: {
    colorPrimary: '#7c3aed',
    borderRadius: 8,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
});
