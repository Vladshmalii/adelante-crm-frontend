import type { Schema } from '@/shared/api';

/** Справочники, общие для нескольких страниц. Значение → подпись (и цвет тега). */
export const genderLabels: Record<Schema<'Gender'>, string> = {
  female: 'Жіноча',
  male: 'Чоловіча',
  other: 'Інша',
};

export const roleLabels: Record<Schema<'Role'>, string> = {
  administrator: 'Адміністратор',
  master: 'Майстер',
};

/** Палитра цветовых меток (клиенты, сотрудники, услуги) — как в старом UI. */
export const COLOR_PRESETS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
];

export const toOptions = <T extends string>(labels: Record<T, string>) =>
  (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }));
