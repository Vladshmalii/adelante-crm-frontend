import { createFileRoute } from '@tanstack/react-router';

import { CertificatesPage, certificatesSearchSchema } from '@/pages/loyalty';

import { requireSection } from '../../-lib/guard';

export const Route = createFileRoute('/_app/loyalty/certificates')({
  validateSearch: certificatesSearchSchema,
  beforeLoad: ({ context }) => {
    requireSection(context.viewer, 'loyalty');
  },
  // Шаблоны и реестр грузятся во вкладках
  component: CertificatesPage,
});
