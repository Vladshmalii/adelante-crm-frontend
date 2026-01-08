'use client';

import { useEffect, createContext, useContext } from 'react';
import { wsClient } from '@/lib/websocket/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { appointmentsApi } from '@/lib/api/appointments';

const WebSocketContext = createContext<typeof wsClient | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    const token = (useAuthStore.getState() as any)?.token as string | undefined;
    const { addNotification } = useNotificationsStore();
    const { setAppointments, selectedDate } = useCalendarStore();

    useEffect(() => {
        if (isAuthenticated && token) {
            wsClient.setToken(token);
            wsClient.connect();

            const handleNotification = (data: any) => {
                addNotification(data);
            };

            const handleAppointmentChange = async () => {
                if (selectedDate) {
                    try {
                        const response = await appointmentsApi.getAll({ date: selectedDate });
                        const list = Array.isArray(response) ? response : (response as any)?.data || [];
                        setAppointments(list as any);
                    } catch (e) {
                        console.error('Failed to update appointments via WS', e);
                    }
                }
            };

            wsClient.on('notification:new', handleNotification);
            wsClient.on('appointment:created', handleAppointmentChange);
            wsClient.on('appointment:updated', handleAppointmentChange);
            wsClient.on('appointment:deleted', handleAppointmentChange);

            return () => {
                wsClient.off('notification:new', handleNotification);
                wsClient.off('appointment:created', handleAppointmentChange);
                wsClient.off('appointment:updated', handleAppointmentChange);
                wsClient.off('appointment:deleted', handleAppointmentChange);
                wsClient.disconnect();
            };
        }
    }, [isAuthenticated, token, selectedDate, addNotification, setAppointments]);

    return (
        <WebSocketContext.Provider value={wsClient}>
            {children}
        </WebSocketContext.Provider>
    );
}

export const useWebSocketContext = () => useContext(WebSocketContext);
