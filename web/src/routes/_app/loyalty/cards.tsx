import { createFileRoute } from '@tanstack/react-router';

import { LoyaltyCardsPage } from '@/pages/loyalty';

import { requireSection } from '../../-lib/guard';

export const Route = createFileRoute('/_app/loyalty/cards')({
  beforeLoad: ({ context }) => {
    requireSection(context.viewer, 'loyalty');
  },
  // Типы карт грузятся на странице
  component: LoyaltyCardsPage,
});
