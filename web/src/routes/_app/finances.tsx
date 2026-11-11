import { createFileRoute, redirect } from '@tanstack/react-router';

import {
  dashboardQueryOptions,
  documentsParams,
  documentsQueryOptions,
  FinancesPage,
  financesSearchSchema,
  operationsParams,
  operationsQueryOptions,
  periodToApi,
  receiptsParams,
  receiptsQueryOptions,
} from '@/pages/finances';

import { requireSection } from '../-lib/guard';

export const Route = createFileRoute('/_app/finances')({
  validateSearch: financesSearchSchema,
  loaderDeps: ({ search }) => search,
  beforeLoad: ({ context, search }) => {
    // Старые ссылки на вкладки, переехавшие в «Лояльність».
    if (search.tab === 'balances') throw redirect({ to: '/loyalty/deposits', replace: true });
    if (search.tab === 'certificates') {
      throw redirect({ to: '/loyalty/certificates', search: { tab: 'issued' }, replace: true });
    }
    requireSection(context.viewer, 'finances');
  },
  // Предзагрузка данных активной вкладки; «Методи оплат» грузятся в самой вкладке.
  loader: async ({ context: { queryClient }, deps }) => {
    const opts = { staleTime: 'static' } as const;
    switch (deps.tab) {
      case 'overview': {
        const { dateFrom, dateTo } = periodToApi(deps);
        await queryClient.query({ ...dashboardQueryOptions(dateFrom, dateTo), ...opts });
        break;
      }
      case 'operations':
        await queryClient.query({ ...operationsQueryOptions(operationsParams(deps)), ...opts });
        break;
      case 'documents':
        await queryClient.query({ ...documentsQueryOptions(documentsParams(deps)), ...opts });
        break;
      case 'receipts':
        await queryClient.query({ ...receiptsQueryOptions(receiptsParams(deps)), ...opts });
        break;
      case 'methods':
        break;
    }
  },
  component: FinancesPage,
});
