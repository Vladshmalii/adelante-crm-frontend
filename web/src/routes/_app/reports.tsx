import { createFileRoute } from '@tanstack/react-router';

import {
  periodToApi,
  ReportsPage,
  reportsSearchSchema,
  summaryQueryOptions,
} from '@/pages/reports';

import { requireSection } from '../-lib/guard';

export const Route = createFileRoute('/_app/reports')({
  validateSearch: reportsSearchSchema,
  loaderDeps: ({ search }) => ({ from: search.from, to: search.to }),
  beforeLoad: ({ context }) => {
    requireSection(context.viewer, 'reports');
  },
  // Сводку грузим заранее, графики и таблицы — в своих блоках.
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.query({ ...summaryQueryOptions(periodToApi(deps)), staleTime: 'static' }),
  component: ReportsPage,
});
