import { env } from '@/shared/config';
import { useSessionStore } from '@/shared/session';

/** Конверт события из сервиса ws/ (Redis pub/sub `salon:{id}:events`). */
export interface RealtimeEvent {
  event_id: string;
  event_type: 'record.created' | 'record.updated' | 'review.created' | (string & {});
  occurred_at: string;
  salon_id: string;
  payload: Record<string, unknown>;
}

type Listener = (event: RealtimeEvent) => void;

/** Закрыть сокет; ещё не открытый — сразу после открытия (иначе браузер ругается в консоль). */
function dispose(ws: WebSocket) {
  ws.onmessage = null;
  if (ws.readyState === WebSocket.CONNECTING) {
    ws.onopen = () => {
      ws.close();
    };
  } else {
    ws.close();
  }
}

const RETRY_MIN = 1_000;
const RETRY_MAX = 30_000;

/**
 * Подключение к WebSocket-уведомлениям текущего салона. Переподключается с растущей паузой,
 * а при смене токена или салона — сразу. Без `WS_URL` не подключается вовсе.
 * Возвращает функцию отписки/закрытия.
 */
export function connectRealtime(onEvent: Listener): () => void {
  if (!env.wsUrl) return () => undefined;

  let socket: WebSocket | null = null;
  let retry = RETRY_MIN;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let closed = false;

  const open = () => {
    clearTimeout(timer);
    const { accessToken, salonId } = useSessionStore.getState();
    if (closed || !accessToken || !salonId) return;

    const url = new URL(env.wsUrl, window.location.href);
    url.searchParams.set('token', accessToken);
    url.searchParams.set('salonId', salonId);
    const ws = new WebSocket(url);
    socket = ws;

    ws.onopen = () => {
      retry = RETRY_MIN;
    };
    ws.onmessage = (message) => {
      try {
        onEvent(JSON.parse(String(message.data)) as RealtimeEvent);
      } catch {
        // Не JSON — игнорируем: протокол сервиса отдаёт только конверты событий.
      }
    };
    ws.onclose = () => {
      if (socket !== ws || closed) return;
      // 4401 — токен протух: следующий запрос к API обновит его, а подписка ниже переподключит.
      timer = setTimeout(open, retry);
      retry = Math.min(retry * 2, RETRY_MAX);
    };
  };

  const reconnect = () => {
    const previous = socket;
    socket = null;
    if (previous) dispose(previous);
    retry = RETRY_MIN;
    open();
  };

  const unsubscribe = useSessionStore.subscribe((state, prev) => {
    if (state.accessToken !== prev.accessToken || state.salonId !== prev.salonId) reconnect();
  });
  open();

  return () => {
    closed = true;
    clearTimeout(timer);
    unsubscribe();
    if (socket) dispose(socket);
  };
}
