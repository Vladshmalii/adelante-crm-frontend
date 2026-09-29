import { createFileRoute } from '@tanstack/react-router';

import {
  CalendarPage,
  calendarRecordsQueryOptions,
  calendarSearchSchema,
  scheduleQueryOptions,
  todayInSalon,
  viewRange,
} from '@/pages/calendar';

import { requireSection } from '../-lib/guard';

export const Route = createFileRoute('/_app/calendar')({
  validateSearch: calendarSearchSchema,
  loaderDeps: ({ search }) => ({ view: search.view, date: search.date }),
  beforeLoad: ({ context }) => {
    requireSection(context.viewer, 'calendar');
  },
  // Графики и записи видимого периода — заранее; сводку месяца грузит сам вид.
  loader: ({ context: { queryClient }, deps }) => {
    const [from, to] = viewRange(deps.view, deps.date ?? todayInSalon());
    const opts = { staleTime: 'static' } as const;
    return Promise.all([
      queryClient.query({ ...scheduleQueryOptions(from, to), ...opts }),
      deps.view === 'month'
        ? null
        : queryClient.query({ ...calendarRecordsQueryOptions(from, to), ...opts }),
    ]);
  },
  component: CalendarPage,
});
