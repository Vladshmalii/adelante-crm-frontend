import { describe, expect, it } from 'vitest';

import type { Schema } from '@/shared/api';

import { canAccess, permissions, toViewer } from './access';

const me = (role: Schema<'Role'>, extra: object = {}) =>
  ({
    id: 'u1',
    firstName: 'Test',
    lastName: null,
    name: 'Test',
    email: null,
    phone: null,
    avatarUrl: null,
    role,
    createdAt: '2026-01-01T00:00:00Z',
    salons: [],
    ...extra,
  }) satisfies Schema<'MeOut'>;

describe('права доступа (docs/ACCESS.md)', () => {
  it('мастер видит только клиентов', () => {
    const v = toViewer(me('master'));
    expect(canAccess(v, 'clients')).toBe(true);
    expect(canAccess(v, 'staff')).toBe(false);
    expect(canAccess(v, 'services')).toBe(false);
    expect(canAccess(v, 'finances')).toBe(false);
    expect(permissions(v).clients).toMatchObject({ create: true, edit: false, delete: false });
  });

  it('администратор — всё, кроме финансов и выгрузок', () => {
    const v = toViewer(me('administrator'));
    expect(canAccess(v, 'staff')).toBe(true);
    expect(canAccess(v, 'finances')).toBe(false);
    const can = permissions(v);
    expect(can.clients).toMatchObject({ edit: true, import: true, export: false });
    expect(can.staff).toMatchObject({
      manageMasters: true,
      manageAdmins: false,
      viewFinance: false,
    });
  });

  it('суперюзер — финансы, выгрузки и управление администраторами', () => {
    const v = toViewer(me('administrator', { isSuperuser: true }));
    expect(canAccess(v, 'finances')).toBe(true);
    const can = permissions(v);
    expect(can.clients.export).toBe(true);
    expect(can.staff).toMatchObject({ manageAdmins: true, viewFinance: true });
  });

  it('флаг суперюзера у мастера игнорируется', () => {
    expect(toViewer(me('master', { isSuperuser: true })).isSuperuser).toBe(false);
  });
});
