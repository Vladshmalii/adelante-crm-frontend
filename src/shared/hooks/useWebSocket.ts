import { useEffect } from 'react';
import { useWebSocketContext } from '../providers/WebSocketProvider';
import { WebSocketEventType } from '@/lib/websocket/client';

export function useWebSocket(event?: WebSocketEventType, handler?: (data: any) => void) {
    const ws = useWebSocketContext();

    useEffect(() => {
        if (ws && event && handler) {
            ws.on(event, handler);
            return () => {
                ws.off(event, handler);
            };
        }
    }, [ws, event, handler]);

    return {
        send: (type: string, data: any) => ws?.send(type, data),
        ws
    };
}
