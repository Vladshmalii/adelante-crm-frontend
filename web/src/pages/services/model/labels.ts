import type { Schema } from '@/shared/api';

export const statusLabels: Record<Schema<'ServiceStatus'>, { text: string; color: string }> = {
  active: { text: 'Активна', color: 'green' },
  inactive: { text: 'Неактивна', color: 'orange' },
  archived: { text: 'Архівна', color: 'default' },
};
