// Клиент WS-notifier backend'а (отдельный сервис, порт 8001 — см.
// backend/ws/main.py). Соединение — /ws?token=<JWT>&salonId=<uuid>;
// сервер ретранслирует события из outbox как есть, без обёртки {type, data}.
//
// Конверт события — внутренний протокол Celery/Redis pub-sub (не REST-ответ
// Admin API), поэтому ключи snake_case, как их пишет
// backend/app/notifications/outbox.py build_envelope(): { event_id,
// event_type, occurred_at, salon_id, payload }.
export type WebSocketEventType = 'record.created' | 'record.updated' | 'review.created';

export interface WebSocketEnvelope<T = unknown> {
    event_id: string;
    event_type: WebSocketEventType;
    occurred_at: string;
    salon_id: string;
    payload: T;
}

type WebSocketHandler = (payload: unknown, envelope: WebSocketEnvelope) => void;

class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private handlers: Map<WebSocketEventType, Set<WebSocketHandler>> = new Map();
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private token: string | null = null;
    private salonId: string | null = null;

    constructor(url: string) {
        this.url = url;
    }

    setToken(token: string) {
        this.token = token;
    }

    setSalonId(salonId: string) {
        this.salonId = salonId;
    }

    connect() {
        if (!this.token || !this.salonId) return;
        if (this.ws?.readyState === WebSocket.OPEN) return;

        const wsUrl = new URL(this.url);
        wsUrl.searchParams.set('token', this.token);
        wsUrl.searchParams.set('salonId', this.salonId);

        this.ws = new WebSocket(wsUrl.toString());

        this.ws.onmessage = (event) => {
            try {
                const envelope = JSON.parse(event.data) as WebSocketEnvelope;
                this.emit(envelope.event_type, envelope.payload, envelope);
            } catch (e) {
                console.error('WebSocket message parsing error', e);
            }
        };

        this.ws.onclose = () => {
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

    private emit(type: WebSocketEventType, payload: unknown, envelope: WebSocketEnvelope) {
        this.handlers.get(type)?.forEach((handler) => handler(payload, envelope));
    }

    disconnect() {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.ws?.close();
        this.ws = null;
    }
}

export const wsClient = new WebSocketClient(
    process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001/ws',
);
