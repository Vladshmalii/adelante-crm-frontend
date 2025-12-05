import { create } from 'zustand';

interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    link?: string;
}

interface NotificationsState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;

    setNotifications: (notifications: Notification[]) => void;
    addNotification: (notification: Notification) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    deleteNotification: (id: string) => void;
    setLoading: (isLoading: boolean) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    setNotifications: (notifications) =>
        set({
            notifications,
            unreadCount: notifications.filter((n) => !n.isRead).length,
        }),

    addNotification: (notification) =>
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
        })),

    markAsRead: (id) =>
        set((state) => {
            const updated = state.notifications.map((n) =>
                n.id === id ? { ...n, isRead: true } : n
            );
            return {
                notifications: updated,
                unreadCount: updated.filter((n) => !n.isRead).length,
            };
        }),

    markAllAsRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
        })),

    deleteNotification: (id) =>
        set((state) => {
            const notification = state.notifications.find((n) => n.id === id);
            const updated = state.notifications.filter((n) => n.id !== id);
            return {
                notifications: updated,
                unreadCount: notification && !notification.isRead
                    ? state.unreadCount - 1
                    : state.unreadCount,
            };
        }),

    setLoading: (isLoading) => set({ isLoading }),
}));
