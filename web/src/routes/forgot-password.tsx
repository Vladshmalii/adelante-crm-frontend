import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { ForgotPasswordPage } from '@/pages/password-reset';

export const Route = createFileRoute('/forgot-password')({
  validateSearch: z.object({ email: z.string().optional() }),
  component: ForgotPasswordRoute,
});

function ForgotPasswordRoute() {
  const { email } = Route.useSearch();
  return <ForgotPasswordPage email={email} />;
}
