import { createFileRoute } from '@tanstack/react-router';

import {
  ClientsPage,
  clientsListQueryOptions,
  clientsSearchSchema,
  toListParams,
} from '@/pages/clients';

import { requireSection } from '../-lib/guard';

export const Route = createFileRoute('/_app/clients')({
  validateSearch: clientsSearchSchema,
  // Открытие карточки (`id`) не должно перезагружать список.
  loaderDeps: ({ search }) => toListParams(search),
  beforeLoad: ({ context }) => {
    requireSection(context.viewer, 'clients');
  },
  loader: ({ context, deps }) =>
    context.queryClient.query({ ...clientsListQueryOptions(deps), staleTime: 'static' }),
  component: ClientsPage,
});
