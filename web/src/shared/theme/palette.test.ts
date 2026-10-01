import { describe, expect, it } from 'vitest';

import { darkPalette, lightPalette, siderPalette, withAlpha } from './palette';

/** HSL из `ui/src/styles/global.css` → `#rrggbb` (как считает браузер). */
function hsl(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return `#${[f(0), f(8), f(4)]
    .map((x) =>
      Math.round(x * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

describe('палитра совпадает со старым UI', () => {
  it('светлая тема (:root)', () => {
    expect(lightPalette).toMatchObject({
      primary: hsl(155, 40, 25),
      primaryHover: hsl(155, 40, 30),
      primaryActive: hsl(155, 40, 20),
      primaryText: hsl(155, 45, 22),
      primaryTextHover: hsl(155, 50, 18),
      background: hsl(0, 0, 98),
      card: hsl(0, 0, 100),
      muted: hsl(0, 0, 96),
      secondary: hsl(0, 0, 95),
      text: hsl(0, 0, 10),
      textSecondary: hsl(0, 0, 40),
      border: hsl(0, 0, 85),
      borderSecondary: hsl(0, 0, 92),
      success: hsl(145, 50, 35),
      warning: hsl(42, 100, 45),
      error: hsl(0, 75, 50),
      errorHover: hsl(0, 75, 45),
      accent: hsl(38, 85, 45),
    });
  });

  it('тёмная тема (.dark)', () => {
    expect(darkPalette).toMatchObject({
      primary: hsl(123, 42, 25),
      primaryHover: hsl(123, 42, 32),
      primaryActive: hsl(123, 42, 20),
      primaryText: hsl(123, 45, 50),
      primaryTextHover: hsl(123, 50, 60),
      background: hsl(0, 0, 10),
      card: hsl(0, 0, 13),
      muted: hsl(0, 0, 16),
      secondary: hsl(0, 0, 18),
      text: hsl(0, 0, 92),
      textSecondary: hsl(0, 0, 60),
      border: hsl(0, 0, 25),
      borderSecondary: hsl(0, 0, 20),
      success: hsl(142, 50, 45),
      warning: hsl(38, 92, 50),
      error: hsl(0, 50, 45),
      errorHover: hsl(0, 50, 50),
      accent: hsl(150, 35, 50),
    });
  });

  it('сайдбар — фиксированные цвета из tailwind.config', () => {
    expect(siderPalette).toEqual({
      background: '#212121',
      text: '#d0d0d0',
      textActive: '#ffffff',
      hover: '#505050',
      border: '#444444',
    });
  });

  it('прозрачность как bg-primary/20', () => {
    expect(withAlpha('#265944', 0.2)).toBe('rgba(38, 89, 68, 0.2)');
  });
});
