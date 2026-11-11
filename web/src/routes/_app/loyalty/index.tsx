import { createFileRoute } from '@tanstack/react-router';

import { LoyaltyHubPage } from '@/pages/loyalty';

import { requireSection } from '../../-lib/guard';

export const Route = createFileRoute('/_app/loyalty/')({
  beforeLoad: ({ context }) => {
    requireSection(context.viewer, 'loyalty');
  },
  component: LoyaltyHubPage,
});
