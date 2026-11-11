/**
 * Украинское склонение по числу: `pluralUk(5, ['день', 'дні', 'днів'])` → «днів».
 * Формы — для 1, для 2–4 и для 5+ (11–14 — тоже последняя).
 */
export function pluralUk(n: number, [one, few, many]: readonly [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs >= 11 && abs <= 14) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}
