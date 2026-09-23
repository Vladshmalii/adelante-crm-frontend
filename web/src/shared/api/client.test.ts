import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/shared/session';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const me = { id: 'u1', name: 'Admin', salons: [] };

/** Фейковый бекенд: /auth/me пускает только с токеном `new`, /auth/refresh выдаёт `new`. */
const fetchMock = vi.fn((request: Request) => {
  const url = new URL(request.url);
  if (url.pathname.endsWith('/auth/refresh')) {
    return Promise.resolve(json({ data: { accessToken: 'new', refreshToken: 'r2' } }));
  }
  const ok = request.headers.get('Authorization') === 'Bearer new';
  return Promise.resolve(ok ? json({ data: me }) : json({ detail: 'expired' }, 401));
});

vi.stubGlobal('fetch', fetchMock);
// openapi-fetch запоминает fetch при создании клиента — импортируем после подмены.
const { api } = await import('./client');

const refreshCalls = () =>
  fetchMock.mock.calls.filter(([r]) => r.url.endsWith('/auth/refresh')).length;

describe('api client auth middleware', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    useSessionStore.setState({ accessToken: 'old', refreshToken: 'r1', salonId: 's1' });
  });

  it('подставляет Authorization и X-Salon-Id', async () => {
    useSessionStore.setState({ accessToken: 'new' });
    await api.GET('/api/admin/v1/auth/me');
    const [request] = fetchMock.mock.calls[0] ?? [];
    expect(request?.headers.get('X-Salon-Id')).toBe('s1');
  });

  it('на 401 обновляет токены и повторяет запрос', async () => {
    const { data } = await api.GET('/api/admin/v1/auth/me');
    expect(data).toEqual({ data: me });
    expect(useSessionStore.getState()).toMatchObject({ accessToken: 'new', refreshToken: 'r2' });
  });

  it('параллельные 401 делают один refresh', async () => {
    await Promise.all([
      api.GET('/api/admin/v1/auth/me'),
      api.GET('/api/admin/v1/auth/me'),
      api.GET('/api/admin/v1/auth/me'),
    ]);
    expect(refreshCalls()).toBe(1);
  });

  it('если refresh не удался — очищает сессию', async () => {
    fetchMock.mockImplementationOnce(() => Promise.resolve(json({ detail: 'expired' }, 401)));
    fetchMock.mockImplementationOnce(() => Promise.resolve(json({ detail: 'bad refresh' }, 401)));
    const { response } = await api.GET('/api/admin/v1/auth/me');
    expect(response.status).toBe(401);
    expect(useSessionStore.getState().accessToken).toBeNull();
  });
});
