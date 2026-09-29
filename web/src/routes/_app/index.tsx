import { createFileRoute, redirect } from '@tanstack/react-router';

// Стартовая страница — Розклад (главный рабочий экран).
export const Route = createFileRoute('/_app/')({
  beforeLoad: () => {
    throw redirect({ to: '/calendar', replace: true });
  },
});
