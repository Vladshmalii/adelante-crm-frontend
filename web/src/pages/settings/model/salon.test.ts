import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import type { Schema } from '@/shared/api';

import { changedFields } from './salon';

const salon: Schema<'SalonInfoOut'> = {
  name: 'Adelante',
  legalName: null,
  city: 'Київ',
  address: 'вул. Хрещатик, 1',
  phone: null,
  email: null,
  website: null,
  instagram: null,
  facebook: null,
  openedOn: '2020-03-01',
  description: null,
};

describe('изменённые поля салона', () => {
  it('без изменений — пусто', () => {
    expect(changedFields(salon, { ...salon, openedOn: dayjs('2020-03-01') })).toEqual({});
  });

  it('отправляет только изменённое, пустое — как null', () => {
    expect(
      changedFields(salon, {
        ...salon,
        city: '  ',
        email: ' info@adelante.ua ',
        openedOn: null,
      }),
    ).toEqual({ city: null, email: 'info@adelante.ua', openedOn: null });
  });
});
