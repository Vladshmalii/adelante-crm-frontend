import type { Dayjs } from 'dayjs';

import type { Schema } from '@/shared/api';

type SalonInfo = Schema<'SalonInfoOut'>;
type Field = keyof SalonInfo;

export type SalonFormValues = Omit<SalonInfo, 'openedOn'> & { openedOn?: Dayjs | null };

const TEXT_FIELDS: Exclude<Field, 'openedOn'>[] = [
  'name',
  'legalName',
  'city',
  'address',
  'phone',
  'email',
  'website',
  'instagram',
  'facebook',
  'description',
];

/** Только изменённые поля; очищенное поле — `null` (бекенд его обнулит). */
export function changedFields(
  before: SalonInfo,
  values: SalonFormValues,
): Schema<'SalonInfoPatchIn'> {
  const patch: Schema<'SalonInfoPatchIn'> = {};
  for (const field of TEXT_FIELDS) {
    const raw = values[field];
    const next = typeof raw === 'string' && raw.trim() ? raw.trim() : null;
    if (next !== before[field]) patch[field] = next;
  }
  const openedOn = values.openedOn ? values.openedOn.format('YYYY-MM-DD') : null;
  if (openedOn !== before.openedOn) patch.openedOn = openedOn;
  return patch;
}
