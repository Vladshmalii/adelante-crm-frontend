import { useEffect } from 'react';
import { useWebSocketContext } from '../providers/WebSocketProvider';
import { WebSocketEventType } from '@/lib/websocket/client';

export function useWebSocket(event?: WebSocketEventType, handler?: (data: unknown) => void) {
    const ws = useWebSocketContext();

    useEffect(() => {
        if (ws && event && handler) {
            ws.on(event, handler);
            return () => {
                ws.off(event, handler);
            };
        }
    }, [ws, event, handler]);

    return { ws };
}
