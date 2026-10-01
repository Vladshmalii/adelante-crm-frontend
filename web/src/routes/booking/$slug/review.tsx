import { createFileRoute } from '@tanstack/react-router';

import { ReviewPage, reviewSearchSchema } from '@/pages/booking';

/** Отзыв после визита — ссылка из Telegram: `/booking/{slug}/review?token=…`. */
export const Route = createFileRoute('/booking/$slug/review')({
  validateSearch: reviewSearchSchema,
  component: ReviewPage,
});
