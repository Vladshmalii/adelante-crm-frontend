import { createFileRoute } from '@tanstack/react-router';

import {
  auditParams,
  auditQueryOptions,
  OverviewPage,
  overviewSearchSchema,
  recordsParams,
  recordsQueryOptions,
  reviewsParams,
  reviewsQueryOptions,
} from '@/pages/overview';

import { requireSection } from '../-lib/guard';

export const Route = createFileRoute('/_app/overview')({
  validateSearch: overviewSearchSchema,
  // Открытие карточки записи не должно перезагружать список.
  loaderDeps: ({ search: { recordId: _recordId, ...search } }) => search,
  beforeLoad: ({ context }) => {
    requireSection(context.viewer, 'overview');
  },
  loader: async ({ context: { queryClient }, deps }) => {
    if (deps.tab === 'reviews') {
      await queryClient.query({ ...reviewsQueryOptions(reviewsParams(deps)), staleTime: 'static' });
    } else if (deps.tab === 'changes') {
      await queryClient.query({ ...auditQueryOptions(auditParams(deps)), staleTime: 'static' });
    } else {
      await queryClient.query({ ...recordsQueryOptions(recordsParams(deps)), staleTime: 'static' });
    }
  },
  component: OverviewPage,
});
