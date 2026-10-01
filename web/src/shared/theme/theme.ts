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

/** Цвета бокового меню ProLayout — тёмное в обеих темах, как в старом UI. */
export function siderToken(mode: ThemeMode) {
  const p = paletteOf(mode);
  return {
    colorMenuBackground: siderPalette.background,
    colorBgMenuItemCollapsedElevated: siderPalette.background,
    colorMenuItemDivider: siderPalette.border,
    colorTextMenu: siderPalette.text,
    colorTextMenuSecondary: siderPalette.text,
    colorTextMenuTitle: siderPalette.textActive,
    colorTextMenuItemHover: siderPalette.textActive,
    colorTextMenuActive: siderPalette.textActive,
    colorTextMenuSelected: siderPalette.textActive,
    colorTextCollapsedButton: siderPalette.text,
    colorTextCollapsedButtonHover: siderPalette.textActive,
    colorBgCollapsedButton: siderPalette.background,
    colorBgMenuItemHover: siderPalette.hover,
    colorBgMenuItemActive: siderPalette.hover,
    colorBgMenuItemSelected: p.primary,
  };
}

/**
 * Тема блоков внутри тёмного сайдбара (мини-календарь, «Додати запис»): тёмная основа на фоне
 * сайдбара, но основной цвет — текущей темы, как у кнопки в старом UI.
 */
export function siderContentTheme(mode: ThemeMode): ThemeConfig {
  const p = paletteOf(mode);
  const dark = getTheme('dark');
  return {
    ...dark,
    token: {
      ...dark.token,
      colorPrimary: p.primary,
      colorPrimaryHover: p.primaryHover,
      colorPrimaryActive: p.primaryActive,
      colorBgContainer: siderPalette.background,
      colorBorderSecondary: siderPalette.border,
    },
  };
}
