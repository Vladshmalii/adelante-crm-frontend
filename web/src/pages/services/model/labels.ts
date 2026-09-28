import type { Schema } from '@/shared/api';

export const statusLabels: Record<Schema<'ServiceStatus'>, { text: string; color: string }> = {
  active: { text: 'Активна', color: 'green' },
  inactive: { text: 'Неактивна', color: 'orange' },
  archived: { text: 'Архівна', color: 'default' },
};

/**
 * Категория — свободная строка на бекенде. Для известных ключей старого UI показываем подпись,
 * остальные выводим как есть.
 */
const KNOWN_CATEGORIES: Record<string, string> = {
  hair: 'Волосся',
  nails: 'Нігті',
  face: 'Обличчя',
  body: 'Тіло',
  makeup: 'Макіяж',
  other: 'Інше',
};

export const categoryLabel = (category: string) => KNOWN_CATEGORIES[category] ?? category;

/** Варианты категорий для формы и фильтра: известные + фактические из бекенда. */
export const categoryOptions = (existing: string[]) =>
  [...new Set([...Object.keys(KNOWN_CATEGORIES), ...existing])].map((value) => ({
    value,
    label: categoryLabel(value),
  }));
