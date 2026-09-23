import { useMutation } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';
import { useSessionStore } from '@/shared/session';

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (body: Schema<'LoginIn'>) =>
      unwrap(await api.POST('/api/admin/v1/auth/login', { body })).data,
    onSuccess: ({ accessToken, refreshToken, user }) => {
      const session = useSessionStore.getState();
      session.setTokens({ accessToken, refreshToken });
      const firstSalon = user.salonIds[0];
      if (firstSalon) session.setSalonId(firstSalon);
    },
  });
}
