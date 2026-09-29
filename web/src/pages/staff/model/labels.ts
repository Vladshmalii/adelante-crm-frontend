import type { Schema } from '@/shared/api';

interface Label {
  text: string;
  color: string;
}

export const statusLabels: Record<Schema<'StaffStatus'>, Label> = {
  active: { text: 'Активні', color: 'green' },
  fired: { text: 'Звільнені', color: 'default' },
};

/** Статус в карточке — в единственном числе. */
export const statusSingular: Record<Schema<'StaffStatus'>, string> = {
  active: 'Активний',
  fired: 'Звільнений',
};

export const staffFullName = (
  s: Pick<Schema<'StaffOut'>, 'firstName' | 'middleName' | 'lastName'>,
) => [s.lastName, s.firstName, s.middleName].filter(Boolean).join(' ');
