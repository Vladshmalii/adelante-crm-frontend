import type { Schema } from '@/shared/api';

interface Label {
  text: string;
  color: string;
}

export const statusLabels: Record<Schema<'StaffStatus'>, Label> = {
  active: { text: 'Активні', color: 'green' },
  vacation: { text: 'У відпустці', color: 'blue' },
  sick: { text: 'На лікарняному', color: 'orange' },
  fired: { text: 'Звільнені', color: 'default' },
};

/** Статус в карточке — в единственном числе. */
export const statusSingular: Record<Schema<'StaffStatus'>, string> = {
  active: 'Активний',
  vacation: 'У відпустці',
  sick: 'На лікарняному',
  fired: 'Звільнений',
};

export const exceptionTypeLabels: Record<Schema<'ScheduleExceptionType'>, Label> = {
  vacation: { text: 'Відпустка', color: 'blue' },
  sick: { text: 'Лікарняний', color: 'orange' },
  day_off: { text: 'Вихідний', color: 'default' },
  extra_shift: { text: 'Додаткова зміна', color: 'green' },
};

export const staffFullName = (
  s: Pick<Schema<'StaffOut'>, 'firstName' | 'middleName' | 'lastName'>,
) => [s.lastName, s.firstName, s.middleName].filter(Boolean).join(' ');
