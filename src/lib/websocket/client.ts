export type WebSocketEventType = 'notification:new' | 'appointment:created' | 'appointment:updated' | 'appointment:deleted';

type WebSocketHandler = (data: any) => void;

class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private handlers: Map<WebSocketEventType, Set<WebSocketHandler>> = new Map();
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private token: string | null = null;

    constructor(url: string) {
        this.url = url;
    }

    setToken(token: string) {
        this.token = token;
    }

    connect() {
        if (!this.token) return;
        if (this.ws?.readyState === WebSocket.OPEN) return;

        const wsUrl = new URL(this.url);
        wsUrl.searchParams.set('token', this.token);

        this.ws = new WebSocket(wsUrl.toString());

        this.ws.onopen = () => {
            console.log('WebSocket connected');
        };

        this.ws.onmessage = (event) => {
            try {
                const { type, data } = JSON.parse(event.data);
                this.emit(type as WebSocketEventType, data);
            } catch (e) {
                console.error('WebSocket message parsing error', e);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.reconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error', error);
            this.ws?.close();
        };
    }

    reconnect() {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
            console.log('Reconnecting WebSocket...');
            this.connect();
        }, 5000);
    }

    on(type: WebSocketEventType, handler: WebSocketHandler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type)?.add(handler);
    }

    off(type: WebSocketEventType, handler: WebSocketHandler) {
        this.handlers.get(type)?.delete(handler);
    }

    private emit(type: WebSocketEventType, data: any) {
        this.handlers.get(type)?.forEach(handler => handler(data));
    }

    send(type: string, data: any) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, data }));
        }
    }

    disconnect() {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.ws?.close();
        this.ws = null;
    }
}

export const wsClient = new WebSocketClient(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws');
