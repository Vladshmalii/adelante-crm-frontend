import apiClient, { ApiResponse } from './client';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    createdAt: string;
    link?: string;
}

export interface NotificationParams {
    page?: number;
    perPage?: number;
    read?: boolean;
}

export const notificationsApi = {
    getNotifications: async (params?: NotificationParams): Promise<ApiResponse<Notification[]>> => {
        return apiClient.get('/notifications', params);
    },

    markAsRead: async (id: string): Promise<void> => {
        return apiClient.patch(`/notifications/${id}/read`);
    },

    markAllAsRead: async (): Promise<void> => {
        return apiClient.patch('/notifications/read-all');
    },

    deleteNotification: async (id: string): Promise<void> => {
        return apiClient.delete(`/notifications/${id}`);
    },
};

export default notificationsApi;
