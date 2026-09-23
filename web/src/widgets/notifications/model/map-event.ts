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

/**
 * Событие WS → уведомление для текущего пользователя или `null`, если его показывать не нужно.
 * Сервис ws/ шлёт все события салона; мастеру оставляем только его записи (docs/ACCESS.md).
 */
export function toNotification(event: RealtimeEvent, viewer: Viewer): NotificationItem | null {
  const p = event.payload;
  const masterId = str(p.master_id);
  if (viewer.isMaster && masterId !== viewer.id) return null;

  const base = { id: event.event_id, at: event.occurred_at, read: false };
  const recordId = str(p.record_id);
  const recordLink = viewer.isAdmin && recordId ? { tab: 'records' as const, recordId } : undefined;
  const who = [str(p.client_name), str(p.master_name)].filter(Boolean).join(' → ');

  switch (event.event_type) {
    case 'record.created': {
      const start = str(p.start_at);
      return {
        ...base,
        kind: 'record',
        title: 'Новий запис',
        text: [who, str(p.service_name), start && formatDateTime(start)]
          .filter(Boolean)
          .join(' · '),
        link: recordLink,
      };
    }
    case 'record.updated': {
      const status = str(p.status);
      return {
        ...base,
        kind: 'record',
        title: status ? 'Статус запису змінено' : 'Запис змінено',
        text:
          [who, status && (STATUS_LABELS[status] ?? status)].filter(Boolean).join(': ') ||
          'Відкрийте запис, щоб побачити зміни',
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
