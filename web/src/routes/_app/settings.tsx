import { createFileRoute, redirect } from '@tanstack/react-router';

import {
  salonInfoQueryOptions,
  salonScheduleQueryOptions,
  SettingsPage,
  settingsSearchSchema,
} from '@/pages/settings';

import { requireSection } from '../-lib/guard';

export const Route = createFileRoute('/_app/settings')({
  validateSearch: settingsSearchSchema,
  loaderDeps: ({ search }) => ({ tab: search.tab }),
  beforeLoad: ({ context, search }) => {
    // Старые ссылки на вкладки, переехавшие в «Лояльність».
    if (search.tab === 'loyalty') throw redirect({ to: '/loyalty/cards', replace: true });
    if (search.tab === 'certificates') {
      throw redirect({ to: '/loyalty/certificates', search: { tab: 'types' }, replace: true });
    }
    requireSection(context.viewer, 'settings');
  },
  loader: ({ context: { queryClient }, deps }) =>
    deps.tab === 'salon'
      ? queryClient.query({ ...salonInfoQueryOptions(), staleTime: 'static' })
      : deps.tab === 'schedule'
        ? queryClient.query({ ...salonScheduleQueryOptions(), staleTime: 'static' })
        : undefined,
  component: SettingsPage,
});
