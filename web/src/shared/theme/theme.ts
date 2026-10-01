import { theme, type ThemeConfig } from 'antd';

import type { ThemeMode } from '@/shared/preferences';

import { darkPalette, lightPalette, type Palette, siderPalette } from './palette';

export const paletteOf = (mode: ThemeMode): Palette =>
  mode === 'dark' ? darkPalette : lightPalette;

/**
 * Тема antd из палитры старого UI. Единая точка кастомизации: страницы берут цвета из токенов
 * (`theme.useToken()`), поэтому перекрашиваются сами.
 */
export function getTheme(mode: ThemeMode): ThemeConfig {
  const p = paletteOf(mode);
  return {
    algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: p.primary,
      colorPrimaryHover: p.primaryHover,
      colorPrimaryActive: p.primaryActive,
      colorPrimaryText: p.primaryText,
      colorPrimaryTextHover: p.primaryTextHover,
      colorLink: p.primaryText,
      colorLinkHover: p.primaryTextHover,
      colorLinkActive: p.primaryActive,
      colorSuccess: p.success,
      colorWarning: p.warning,
      colorError: p.error,
      colorErrorHover: p.errorHover,
      colorBgLayout: p.background,
      colorBgContainer: p.card,
      colorBgElevated: p.card,
      colorText: p.text,
      colorTextSecondary: p.textSecondary,
      colorBorder: p.border,
      colorBorderSecondary: p.borderSecondary,
      colorFillQuaternary: p.muted,
      colorFillTertiary: p.secondary,
      borderRadius: 8,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
  };
}

/**
 * Цвета сайдбара: в тёмной теме — тёмный `#212121` старого UI, в светлой — светлый (фон карточек).
 * Активный пункт в обеих — плашка основного цвета с белым текстом.
 */
function siderColors(mode: ThemeMode) {
  if (mode === 'dark') return siderPalette;
  return {
    background: lightPalette.card,
    text: lightPalette.text,
    textActive: lightPalette.text,
    hover: lightPalette.muted,
    border: lightPalette.borderSecondary,
  };
}

/** Цвета бокового меню ProLayout. */
export function siderToken(mode: ThemeMode) {
  const p = paletteOf(mode);
  const c = siderColors(mode);
  return {
    colorMenuBackground: c.background,
    colorBgMenuItemCollapsedElevated: c.background,
    colorMenuItemDivider: c.border,
    colorTextMenu: c.text,
    colorTextMenuSecondary: c.text,
    colorTextMenuTitle: c.textActive,
    colorTextMenuItemHover: c.textActive,
    colorTextMenuActive: c.textActive,
    colorTextMenuSelected: '#ffffff',
    colorTextCollapsedButton: c.text,
    colorTextCollapsedButtonHover: c.textActive,
    colorBgCollapsedButton: c.background,
    colorBgMenuItemHover: c.hover,
    colorBgMenuItemActive: c.hover,
    colorBgMenuItemSelected: p.primary,
  };
}

/**
 * Тема блоков внутри сайдбара (мини-календарь): в светлой теме — обычная светлая, в тёмной —
 * тёмная на фоне сайдбара.
 */
export function siderContentTheme(mode: ThemeMode): ThemeConfig {
  const base = getTheme(mode);
  if (mode === 'light') return base;
  return {
    ...base,
    token: {
      ...base.token,
      colorBgContainer: siderPalette.background,
      colorBorderSecondary: siderPalette.border,
    },
  };
}
