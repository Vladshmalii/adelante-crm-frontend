import { createRouter } from '@tanstack/react-router';

import { useSessionStore } from '@/shared/session';

import { routeTree } from '../routeTree.gen';
import { queryClient } from './query-client';
import { RouteError } from './RouteError';

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  // Свежесть данных контролирует TanStack Query, а не кеш лоадеров роутера.
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  defaultErrorComponent: RouteError,
});

// Разлогин (вручную или после неудачного refresh) → перезапуск guard'ов → /login.
useSessionStore.subscribe((state, prev) => {
  if (prev.accessToken && !state.accessToken) {
    queryClient.clear();
    void router.invalidate();
  }
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
