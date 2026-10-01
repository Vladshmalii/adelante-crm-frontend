import createClient, { type Middleware } from 'openapi-fetch';

import { env } from '@/shared/config';
import { useSessionStore } from '@/shared/session';

import type { paths } from './schema.gen';

/** Эндпоинты, которым не нужен (и не должен уходить) access-токен и refresh по 401. */
const PUBLIC_PATHS = new Set<string>([
  '/api/admin/v1/auth/login',
  '/api/admin/v1/auth/refresh',
  '/api/admin/v1/auth/forgot-password',
  '/api/admin/v1/auth/reset-password',
]);

/** Клиент без middleware — только для refresh, чтобы не зациклиться на 401. */
const bareClient = createClient<paths>({ baseUrl: env.apiUrl });

let refreshing: Promise<string | null> | null = null;

/** Обновляет пару токенов. Параллельные 401 ждут один и тот же запрос. */
export function refreshTokens(): Promise<string | null> {
  refreshing ??= (async () => {
    const { refreshToken, setTokens } = useSessionStore.getState();
    if (!refreshToken) return null;
    try {
      const { data } = await bareClient.POST('/api/admin/v1/auth/refresh', {
        body: { refreshToken },
      });
      if (!data) return null;
      setTokens(data.data);
      return data.data.accessToken;
    } catch {
      return null;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** Копии исходных запросов, чтобы повторить их после refresh (тело Request читается один раз). */
const retryable = new Map<string, Request>();

const authMiddleware: Middleware = {
  onRequest({ request, schemaPath, id }) {
    if (PUBLIC_PATHS.has(schemaPath)) return request;

    const { accessToken, salonId } = useSessionStore.getState();
    if (accessToken) request.headers.set('Authorization', `Bearer ${accessToken}`);
    if (salonId) request.headers.set('X-Salon-Id', salonId);
    retryable.set(id, request.clone());
    return request;
  },

  async onResponse({ response, id }) {
    const original = retryable.get(id);
    retryable.delete(id);
    if (response.status !== 401 || !original) return response;

    const accessToken = await refreshTokens();
    if (!accessToken) {
      // Сессия протухла: чистим стор — роутер увидит это и отправит на /login.
      useSessionStore.getState().clear();
      return response;
    }
    original.headers.set('Authorization', `Bearer ${accessToken}`);
    return fetch(original);
  },

  onError({ id }) {
    retryable.delete(id);
  },
};

export const api = createClient<paths>({ baseUrl: env.apiUrl });
api.use(authMiddleware);

/**
 * Клиент публичного Booking API (сайт записи): без токена, `X-Salon-Id` и refresh — салон
 * задаётся slug'ом в пути.
 */
export const publicApi = createClient<paths>({ baseUrl: env.apiUrl });
