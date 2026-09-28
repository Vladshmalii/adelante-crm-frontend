import type { Viewer } from '@/shared/auth';
import { formatDateTime } from '@/shared/lib';
import type { RealtimeEvent } from '@/shared/realtime';

import type { NotificationItem } from './store';

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'очікування',
  confirmed: 'підтверджено',
  arrived: 'клієнт прийшов',
  completed: 'завершено',
  cancelled: 'скасовано',
  no_show: 'не прийшов',
};

const str = (v: unknown) => (typeof v === 'string' ? v : undefined);

/** Заголовок уведомления по виду изменения записи (`payload.change`). */
const CHANGE_TITLES: Record<string, string> = {
  rescheduled: 'Запис перенесено',
  reassigned: 'Запис передано іншому майстру',
  cancelled: 'Запис скасовано',
  status: 'Статус запису змінено',
  completed: 'Візит завершено',
  paid: 'Запис оплачено',
  unpaid: 'Оплату запису скасовано',
  updated: 'Запис змінено',
};

/**
 * Событие WS → уведомление для текущего пользователя или `null`, если его показывать не нужно.
 * Сервис ws/ уже шлёт мастеру только его события; фильтр ниже — страховка (docs/ACCESS.md):
 * своя запись или запись, которую у мастера забрали.
 */
export function toNotification(event: RealtimeEvent, viewer: Viewer): NotificationItem | null {
  const p = event.payload;
  const mine = str(p.master_id) === viewer.id || str(p.previous_master_id) === viewer.id;
  if (viewer.isMaster && !mine) return null;

  const base = { id: event.event_id, at: event.occurred_at, read: false };
  const recordId = str(p.record_id);
  const recordLink = viewer.isAdmin && recordId ? { tab: 'records' as const, recordId } : undefined;
  // `master_name: null` — запись «Без майстра»; поля нет вовсе — просто не знаем мастера.
  const master = p.master_name === null ? 'без майстра' : str(p.master_name);
  const who = [str(p.client_name), master].filter(Boolean).join(' → ');
  const services =
    Array.isArray(p.service_names) && p.service_names.length
      ? p.service_names.filter((n): n is string => typeof n === 'string').join(', ')
      : str(p.service_name);

  switch (event.event_type) {
    case 'record.created': {
      const start = str(p.start_at);
      return {
        ...base,
        kind: 'record',
        title: 'Новий запис',
        text: [who, services, start && formatDateTime(start)].filter(Boolean).join(' · '),
        link: recordLink,
      };
    }
    case 'record.updated': {
      const change = str(p.change);
      const status = str(p.status);
      const start = str(p.start_at);
      const detail =
        change === 'rescheduled' && start
          ? `новий час ${formatDateTime(start)}`
          : change === 'status' && status
            ? (STATUS_LABELS[status] ?? status)
            : undefined;
      return {
        ...base,
        kind: 'record',
        title:
          (change && CHANGE_TITLES[change]) ?? (status ? 'Статус запису змінено' : 'Запис змінено'),
        text: [who, detail].filter(Boolean).join(': ') || 'Відкрийте запис, щоб побачити зміни',
        link: recordLink,
      };
    }
    case 'review.created': {
      const rating = typeof p.rating === 'number' ? p.rating : 0;
      return {
        ...base,
        kind: 'review',
        title: 'Новий відгук',
        text: `${str(p.client_name) ?? 'Клієнт'}: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`,
        link: viewer.isAdmin ? { tab: 'reviews' } : undefined,
      };
    }
    default:
      return null;
  }
}
