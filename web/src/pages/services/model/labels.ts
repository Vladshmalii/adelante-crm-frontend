import type { Schema } from '@/shared/api';
import { KNOWN_SERVICE_CATEGORIES, serviceCategoryLabel } from '@/shared/lib';

export const statusLabels: Record<Schema<'ServiceStatus'>, { text: string; color: string }> = {
  active: { text: 'Активна', color: 'green' },
  inactive: { text: 'Неактивна', color: 'orange' },
  archived: { text: 'Архівна', color: 'default' },
};

/** Варианты категорий для формы и фильтра: известные + фактические из бекенда. */
export const categoryOptions = (existing: string[]) =>
  [...new Set([...Object.keys(KNOWN_SERVICE_CATEGORIES), ...existing])].map((value) => ({
    value,
    label: serviceCategoryLabel(value),
  }));
