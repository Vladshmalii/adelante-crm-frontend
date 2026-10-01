import { createFileRoute } from '@tanstack/react-router';

import { SalonsPage } from '@/pages/booking';

/** Публичный сайт записи — без входа и без оболочки админки. */
export const Route = createFileRoute('/booking/')({
  component: SalonsPage,
});
