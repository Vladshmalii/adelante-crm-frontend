import { createFileRoute } from '@tanstack/react-router';

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
  beforeLoad: ({ context }) => {
    requireSection(context.viewer, 'settings');
  },
  // «Лояльність» грузится в самой вкладке
  loader: ({ context: { queryClient }, deps }) =>
    deps.tab === 'salon'
      ? queryClient.query({ ...salonInfoQueryOptions(), staleTime: 'static' })
      : deps.tab === 'schedule'
        ? queryClient.query({ ...salonScheduleQueryOptions(), staleTime: 'static' })
        : undefined,
  component: SettingsPage,
});
