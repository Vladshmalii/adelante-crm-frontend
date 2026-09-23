import { createFileRoute } from '@tanstack/react-router';

import { StaffPage, staffListQueryOptions, staffSearchSchema } from '@/pages/staff';

import { requireSection } from '../-lib/guard';

export const Route = createFileRoute('/_app/staff')({
  validateSearch: staffSearchSchema,
  loaderDeps: ({ search }) => search,
  beforeLoad: ({ context }) => {
    requireSection(context.viewer, 'staff');
  },
  loader: ({ context, deps }) =>
    context.queryClient.query({ ...staffListQueryOptions(deps), staleTime: 'static' }),
  component: StaffPage,
});
