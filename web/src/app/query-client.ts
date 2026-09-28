import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/shared/api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // 4xx повторять бессмысленно; 401 уже обработан refresh-middleware.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 2,
    },
  },
});
