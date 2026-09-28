import { useMutation } from '@tanstack/react-query';

import { api, unwrap } from '@/shared/api';

/** Бекенд всегда отвечает 204 — не раскрывает, есть ли такой email. */
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      unwrap(await api.POST('/api/admin/v1/auth/forgot-password', { body: { email } }));
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (body: { token: string; password: string }) => {
      unwrap(await api.POST('/api/admin/v1/auth/reset-password', { body }));
    },
  });
}
