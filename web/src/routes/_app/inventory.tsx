import { createFileRoute } from '@tanstack/react-router';

import {
  InventoryPage,
  inventorySearchSchema,
  inventorySummaryQueryOptions,
  productsQueryOptions,
} from '@/pages/inventory';

import { requireSection } from '../-lib/guard';

export const Route = createFileRoute('/_app/inventory')({
  validateSearch: inventorySearchSchema,
  loaderDeps: ({ search }) => search,
  beforeLoad: ({ context }) => {
    requireSection(context.viewer, 'inventory');
  },
  loader: ({ context: { queryClient }, deps }) => {
    const opts = { staleTime: 'static' } as const;
    return Promise.all([
      queryClient.query({ ...productsQueryOptions(deps), ...opts }),
      queryClient.query({ ...inventorySummaryQueryOptions(), ...opts }),
    ]);
  },
  component: InventoryPage,
});
