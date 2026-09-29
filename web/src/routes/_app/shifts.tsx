import { createFileRoute } from '@tanstack/react-router';

import {
  mondayOf,
  periodDays,
  shiftGridQueryOptions,
  ShiftsPage,
  shiftsSearchSchema,
  todayInSalon,
} from '@/pages/shifts';

import { requireSection } from '../-lib/guard';

export const Route = createFileRoute('/_app/shifts')({
  validateSearch: shiftsSearchSchema,
  loaderDeps: ({ search }) => search,
  beforeLoad: ({ context }) => {
    requireSection(context.viewer, 'shifts');
  },
  loader: ({ context: { queryClient }, deps }) => {
    const from = deps.from ?? mondayOf(todayInSalon());
    const days = periodDays(from, deps.weeks);
    return queryClient.query({
      ...shiftGridQueryOptions(from, days[days.length - 1] ?? from),
      staleTime: 'static',
    });
  },
  component: ShiftsPage,
});
