import { describe, expect, it } from 'vitest';

import type { Viewer } from '@/shared/auth';
import type { RealtimeEvent } from '@/shared/realtime';

import { toNotification } from './map-event';

const admin: Viewer = {
  id: 'a1',
  role: 'administrator',
  isAdmin: true,
  isMaster: false,
  isSuperuser: false,
};
const master: Viewer = {
  id: 'm1',
  role: 'master',
  isAdmin: false,
  isMaster: true,
  isSuperuser: false,
};

const event = (event_type: string, payload: Record<string, unknown>): RealtimeEvent => ({
  event_id: 'e1',
  event_type,
  occurred_at: '2026-09-23T10:00:00Z',
  salon_id: 's1',
  payload,
});

const created = event('record.created', {
  record_id: 'r1',
  client_name: 'Марія',
  master_id: 'm1',
  master_name: 'Юлія',
  service_name: 'Стрижка',
  start_at: '2026-09-24T09:00:00Z',
});

describe('toNotification', () => {
  it('новая запись для администратора — со ссылкой на запись', () => {
    const n = toNotification(created, admin);
    expect(n).toMatchObject({ title: 'Новий запис', link: { tab: 'records', recordId: 'r1' } });
    expect(n?.text).toContain('Марія → Юлія');
    expect(n?.text).toContain('24.09.2026 12:00'); // время салона (Киев, UTC+3)
  });

  it('мастер видит только свои записи и без ссылки в «Огляд»', () => {
    expect(toNotification(created, master)?.link).toBeUndefined();
    expect(toNotification(created, { ...master, id: 'other' })).toBeNull();
  });

  it('мастер видит, что его запись передали другому', () => {
    const n = toNotification(
      event('record.updated', {
        record_id: 'r1',
        master_id: 'm2',
        previous_master_id: 'm1',
        master_name: 'Анна',
        client_name: 'Марія',
        change: 'reassigned',
      }),
      master,
    );
    expect(n).toMatchObject({ title: 'Запис передано іншому майстру', text: 'Марія → Анна' });
  });

  it('запись без мастера и несколько услуг', () => {
    const n = toNotification(
      event('record.created', {
        record_id: 'r2',
        client_name: 'Ольга',
        master_id: null,
        master_name: null,
        service_names: ['Стрижка', 'Укладка'],
        start_at: '2026-09-24T09:00:00Z',
      }),
      admin,
    );
    expect(n?.text).toBe('Ольга → без майстра · Стрижка, Укладка · 24.09.2026 12:00');
  });

  it('смена статуса — с переводом статуса', () => {
    const n = toNotification(
      event('record.updated', { record_id: 'r1', status: 'no_show', change: 'status' }),
      admin,
    );
    expect(n).toMatchObject({ title: 'Статус запису змінено', text: 'не прийшов' });
  });

  it('перенос — с новым временем', () => {
    const n = toNotification(
      event('record.updated', {
        record_id: 'r1',
        client_name: 'Марія',
        master_name: 'Юлія',
        change: 'rescheduled',
        start_at: '2026-09-25T08:30:00Z',
      }),
      admin,
    );
    expect(n).toMatchObject({
      title: 'Запис перенесено',
      text: 'Марія → Юлія: новий час 25.09.2026 11:30',
    });
  });

  it('отзыв — со звёздами', () => {
    const n = toNotification(event('review.created', { rating: 4, client_name: 'Оля' }), admin);
    expect(n).toMatchObject({ kind: 'review', text: 'Оля: ★★★★☆', link: { tab: 'reviews' } });
  });

  it('неизвестные события пропускает', () => {
    expect(toNotification(event('record.reminder', {}), admin)).toBeNull();
  });
});
