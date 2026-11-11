import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';
import { certificateKeys } from '@/widgets/certificates';

export { certificateTemplatesQueryOptions } from '@/widgets/certificates';

export function useSaveCertificateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: Schema<'CertificateTemplateIn'> }) =>
      id
        ? unwrap(
            await api.PATCH('/api/admin/v1/certificates/templates/{template_id}', {
              params: { path: { template_id: id } },
              body,
            }),
          ).data
        : unwrap(await api.POST('/api/admin/v1/certificates/templates', { body })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: certificateKeys.all }),
  });
}
