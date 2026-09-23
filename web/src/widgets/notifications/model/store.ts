import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NotificationItem {
  id: string;
  kind: 'record' | 'review';
  title: string;
  text: string;
  /** ISO-время события. */
  at: string;
  read: boolean;
  /** Куда вести по клику (раздел «Огляд»); нет — уведомление без перехода. */
  link?: { tab: 'records' | 'reviews'; recordId?: string };
}

const LIMIT = 50;

interface NotificationsState {
  items: NotificationItem[];
  add: (item: NotificationItem) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

/** Лента уведомлений в шапке. Хранится локально (последние 50), переживает перезагрузку. */
export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) => {
        set((s) =>
          // Доставка at-least-once — дубли по event_id отбрасываем.
          s.items.some((i) => i.id === item.id) ? s : { items: [item, ...s.items].slice(0, LIMIT) },
        );
      },
      markRead: (id) => {
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, read: true } : i)) }));
      },
      markAllRead: () => {
        set((s) => ({ items: s.items.map((i) => ({ ...i, read: true })) }));
      },
      clear: () => {
        set({ items: [] });
      },
    }),
    { name: 'adelante.notifications' },
  ),
);
