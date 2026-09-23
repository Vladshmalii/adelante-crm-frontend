import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { ResetPasswordPage } from '@/pages/password-reset';

/** Ссылка из письма: `/reset-password?token=…` (формат, который должен слать бекенд). */
export const Route = createFileRoute('/reset-password')({
  validateSearch: z.object({ token: z.string().optional() }),
  component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
  const { token } = Route.useSearch();
  return <ResetPasswordPage token={token} />;
}
