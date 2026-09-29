import { useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useEffect } from 'react';

import { useViewer } from '@/shared/auth';
import { connectRealtime } from '@/shared/realtime';

import { toNotification } from './map-event';
import { useNotificationsStore } from './store';

/** Какие данные устарели после события — перезапрашиваем их на открытых страницах. */
const STALE_KEYS: Record<string, string[][]> = {
  'record.created': [['records'], ['clients'], ['audit']],
  'record.updated': [['records'], ['clients'], ['audit'], ['finances']],
  'review.created': [['reviews']],
  // Смены поменялись: сетка «Графік роботи», рабочее время и загрузка в Розкладі.
  'shift.changed': [['shifts'], ['schedule'], ['records', 'daily-summary']],
};

/** Подписка на WebSocket-уведомления салона на время жизни layout. */
export function useRealtimeNotifications() {
  const { viewer } = useViewer();
  const queryClient = useQueryClient();
  const { notification } = App.useApp();
  const add = useNotificationsStore((s) => s.add);

  useEffect(
    () =>
      connectRealtime((event) => {
        for (const queryKey of STALE_KEYS[event.event_type] ?? []) {
          void queryClient.invalidateQueries({ queryKey });
        }
        const item = toNotification(event, viewer);
        if (!item) return;
        add(item);
        // Всплывающее окно — только о новом; изменения видно в колокольчике.
        if (event.event_type !== 'record.updated') {
          notification.info({
            title: item.title,
            description: item.text,
            placement: 'bottomRight',
          });
        }
      }),
    [viewer, queryClient, notification, add],
  );
}
