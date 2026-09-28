import { createFileRoute } from '@tanstack/react-router';

import { ServicesPage, servicesListQueryOptions, servicesSearchSchema } from '@/pages/services';

import { requireSection } from '../-lib/guard';

export const Route = createFileRoute('/_app/services')({
  validateSearch: servicesSearchSchema,
  loaderDeps: ({ search }) => search,
  beforeLoad: ({ context }) => {
    requireSection(context.viewer, 'services');
  },
  loader: ({ context, deps }) =>
    context.queryClient.query({ ...servicesListQueryOptions(deps), staleTime: 'static' }),
  component: ServicesPage,
});
