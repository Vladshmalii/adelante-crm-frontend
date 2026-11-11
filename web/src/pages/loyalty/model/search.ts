import { z } from 'zod';

export const CERTIFICATES_TABS = ['types', 'issued'] as const;
export type CertificatesTabKey = (typeof CERTIFICATES_TABS)[number];

/** «Лояльність → Сертифікати»: вкладка в URL, как в «Фінансах». */
export const certificatesSearchSchema = z.object({
  tab: z.enum(CERTIFICATES_TABS).default('types'),
});

export type CertificatesSearch = z.infer<typeof certificatesSearchSchema>;
