import type { Schema } from '@/shared/api';

type ShiftKind = Schema<'ShiftKind'>;

/** Отметки графика вместо смены: відпустка і лікарняний (Розклад и «Графік роботи»). */
export const shiftMarkLabels: Record<
  Exclude<ShiftKind, 'shift'>,
  { text: string; color: string }
> = {
  vacation: { text: 'Відпустка', color: 'blue' },
  sick: { text: 'Лікарняний', color: 'orange' },
};
