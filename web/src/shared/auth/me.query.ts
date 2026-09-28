import { queryOptions } from '@tanstack/react-query';

import { api, unwrap } from '@/shared/api';

export const meQueryOptions = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: async ({ signal }) => unwrap(await api.GET('/api/admin/v1/auth/me', { signal })).data,
  staleTime: 5 * 60_000,
});
