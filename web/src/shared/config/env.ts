/**
 * Конфигурация приложения.
 *
 * В проде значения приходят в рантайме из /config.js (его пишет entrypoint
 * docker-образа из переменных окружения), поэтому один и тот же образ
 * работает с любым бекендом. В dev — из VITE_* переменных (.env.local).
 */
interface RuntimeConfig {
  API_URL?: string;
  /** Адрес WebSocket-сервиса уведомлений (`wss://…/ws`). Пусто — уведомления в реальном времени выключены. */
  WS_URL?: string;
}

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig;
  }
}

const runtime = window.__APP_CONFIG__ ?? {};

/** Пустая строка (незаданная переменная в docker/env) = значение отсутствует. */
const nonEmpty = (value: string | undefined) => (value === '' ? undefined : value);

export const env = {
  apiUrl:
    nonEmpty(runtime.API_URL) ?? nonEmpty(import.meta.env.VITE_API_URL) ?? 'http://localhost:8000',
  wsUrl: nonEmpty(runtime.WS_URL) ?? nonEmpty(import.meta.env.VITE_WS_URL) ?? '',
  isDev: import.meta.env.DEV,
} as const;
