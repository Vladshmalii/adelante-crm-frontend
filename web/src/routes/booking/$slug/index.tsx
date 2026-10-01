import { createFileRoute } from '@tanstack/react-router';

import { BookingPage, bookingSearchSchema } from '@/pages/booking';

/** Онлайн-запись в салон по slug (ссылки из бота, напоминаний и соцсетей). */
export const Route = createFileRoute('/booking/$slug/')({
  validateSearch: bookingSearchSchema,
  component: BookingPage,
});
