'use client';

import { useEffect, createContext, useContext } from 'react';
import { wsClient } from '@/lib/websocket/client';
import { useAuthStore } from '@/stores/useAuthStore';
import apiClient from '@/lib/api/client';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { appointmentsApi } from '@/lib/api/appointments';
import { USE_MOCK_DATA } from '@/lib/config';

// Payload'ы событий WS — snake_case конверт, см. комментарий в lib/websocket/client.ts
interface ReviewCreatedPayload {
    review_id?: string;
    rating: number;
    client_name?: string;
}

interface RecordChangedPayload {
    record_id?: string;
    client_name?: string;
    master_name?: string;
}

const WebSocketContext = createContext<typeof wsClient | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    const { addNotification } = useNotificationsStore();
    const { setAppointments, selectedDate } = useCalendarStore();

    useEffect(() => {
        // Мок-режим и SSR — соединяться некому/незачем
        if (USE_MOCK_DATA || typeof window === 'undefined') return;

        const token = localStorage.getItem('auth_token');
        const salonId = apiClient.getSalonId();

        if (isAuthenticated && token && salonId) {
            wsClient.setToken(token);
            wsClient.setSalonId(salonId);
            wsClient.connect();

            const handleReviewCreated = (rawPayload: unknown) => {
                const payload = rawPayload as ReviewCreatedPayload;
                addNotification({
                    id: payload.review_id ?? crypto.randomUUID(),
                    type: 'info',
                    title: 'Новий відгук',
                    message: `Оцінка ${payload.rating}/5 від ${payload.client_name ?? 'клієнта'}`,
                    isRead: false,
                    createdAt: new Date().toISOString(),
                });
            };

            const handleRecordChange = async (rawPayload: unknown) => {
                const payload = rawPayload as RecordChangedPayload;
                addNotification({
                    id: payload.record_id ?? crypto.randomUUID(),
                    type: 'info',
                    title: 'Оновлення запису',
                    message: payload.client_name
                        ? `${payload.client_name} → ${payload.master_name ?? ''}`.trim()
                        : 'Запис оновлено',
                    isRead: false,
                    createdAt: new Date().toISOString(),
                });

                if (selectedDate) {
                    try {
                        const response = await appointmentsApi.getAll({ date: selectedDate });
                        const list = Array.isArray(response)
                            ? response
                            : ((response as unknown as { data?: typeof response })?.data ?? []);
                        setAppointments(list);
                    } catch (e) {
                        console.error('Failed to update appointments via WS', e);
                    }
                }
            };

            wsClient.on('record.created', handleRecordChange);
            wsClient.on('record.updated', handleRecordChange);
            wsClient.on('review.created', handleReviewCreated);

            return () => {
                wsClient.off('record.created', handleRecordChange);
                wsClient.off('record.updated', handleRecordChange);
                wsClient.off('review.created', handleReviewCreated);
                wsClient.disconnect();
            };
        }
    }, [isAuthenticated, selectedDate, addNotification, setAppointments]);

    return <WebSocketContext.Provider value={wsClient}>{children}</WebSocketContext.Provider>;
}

export const useWebSocketContext = () => useContext(WebSocketContext);
