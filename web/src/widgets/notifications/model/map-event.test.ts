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

  it('смена статуса — с переводом статуса', () => {
    const n = toNotification(
      event('record.updated', { record_id: 'r1', status: 'no_show' }),
      admin,
    );
    expect(n).toMatchObject({ title: 'Статус запису змінено', text: 'не прийшов' });
  });

  it('отзыв — со звёздами', () => {
    const n = toNotification(event('review.created', { rating: 4, client_name: 'Оля' }), admin);
    expect(n).toMatchObject({ kind: 'review', text: 'Оля: ★★★★☆', link: { tab: 'reviews' } });
  });

  it('неизвестные события пропускает', () => {
    expect(toNotification(event('record.reminder', {}), admin)).toBeNull();
  });
});
