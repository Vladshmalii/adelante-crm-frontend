import { createFileRoute, redirect } from '@tanstack/react-router';

// Стартовая страница — Розклад, когда он появится; пока — клиенты.
export const Route = createFileRoute('/_app/')({
  beforeLoad: () => {
    throw redirect({ to: '/clients', replace: true });
  },
});
