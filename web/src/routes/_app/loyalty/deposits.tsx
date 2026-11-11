import { createFileRoute } from '@tanstack/react-router';

import { DepositsPage } from '@/pages/loyalty';

import { requireSection } from '../../-lib/guard';

export const Route = createFileRoute('/_app/loyalty/deposits')({
  beforeLoad: ({ context }) => {
    requireSection(context.viewer, 'loyalty');
  },
  component: DepositsPage,
});
