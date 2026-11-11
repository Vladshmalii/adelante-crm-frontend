import { createFileRoute } from '@tanstack/react-router';

import { SubscriptionsPage, subscriptionsSearchSchema } from '@/pages/loyalty';

import { requireSection } from '../../-lib/guard';

export const Route = createFileRoute('/_app/loyalty/subscriptions')({
  validateSearch: subscriptionsSearchSchema,
  beforeLoad: ({ context }) => {
    requireSection(context.viewer, 'loyalty');
  },
  // Типы и реестр грузятся во вкладках
  component: SubscriptionsPage,
});
