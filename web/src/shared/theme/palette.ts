/**
 * Палитра старого UI (`ui/src/styles/global.css`, HSL → HEX). Основной цвет в темах разный, как
 * в старом UI: в светлой — сине-зелёный (hue 155), в тёмной — зелёный (hue 123). Тёмно-зелёный на
 * тёмном фоне не читается как текст — для ссылок и текста основным цветом свой оттенок.
 */
export interface Palette {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  /** Текст и ссылки основным цветом. */
  primaryText: string;
  primaryTextHover: string;
  /** Фон страницы. */
  background: string;
  /** Карточки, таблицы, модалки, выпадающие списки. */
  card: string;
  /** Приглушённый фон (заливки, плашки). */
  muted: string;
  secondary: string;
  text: string;
  textSecondary: string;
  /** Рамки полей ввода. */
  border: string;
  /** Разделители, рамки карточек и таблиц. */
  borderSecondary: string;
  success: string;
  warning: string;
  error: string;
  errorHover: string;
  /** Акцент старого UI (янтарь в светлой теме). */
  accent: string;
}

export const lightPalette: Palette = {
  primary: '#265944',
  primaryHover: '#2e6b52',
  primaryActive: '#1f4736',
  primaryText: '#1f513c',
  primaryTextHover: '#174532',
  background: '#fafafa',
  card: '#ffffff',
  muted: '#f5f5f5',
  secondary: '#f2f2f2',
  text: '#1a1a1a',
  textSecondary: '#666666',
  border: '#d9d9d9',
  borderSecondary: '#ebebeb',
  success: '#2d8652',
  warning: '#e6a100',
  error: '#df2020',
  errorHover: '#c91d1d',
  accent: '#d48d11',
};

export const darkPalette: Palette = {
  primary: '#255b28',
  primaryHover: '#2f7433',
  primaryActive: '#1e4820',
  primaryText: '#46b94c',
  primaryTextHover: '#66cc6b',
  background: '#1a1a1a',
  card: '#212121',
  muted: '#292929',
  secondary: '#2e2e2e',
  text: '#ebebeb',
  textSecondary: '#999999',
  border: '#404040',
  borderSecondary: '#333333',
  success: '#39ac63',
  warning: '#f59f0a',
  error: '#ac3939',
  errorHover: '#bf4040',
  accent: '#53ac80',
};

/** Сайдбар старого UI — тёмный в обеих темах. */
export const siderPalette = {
  background: '#212121',
  text: '#d0d0d0',
  textActive: '#ffffff',
  hover: '#505050',
  border: '#444444',
};

/** `#rrggbb` + прозрачность → `rgba(...)` — аналог `bg-primary/20` из старого UI. */
export function withAlpha(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
