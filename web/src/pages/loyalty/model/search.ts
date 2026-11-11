import { z } from 'zod';

export const CERTIFICATES_TABS = ['types', 'issued'] as const;
export type CertificatesTabKey = (typeof CERTIFICATES_TABS)[number];

/** «Лояльність → Сертифікати»: вкладка в URL, как в «Фінансах». */
export const certificatesSearchSchema = z.object({
  tab: z.enum(CERTIFICATES_TABS).default('types'),
});

export type CertificatesSearch = z.infer<typeof certificatesSearchSchema>;

export const SUBSCRIPTIONS_TABS = ['types', 'sold'] as const;
export type SubscriptionsTabKey = (typeof SUBSCRIPTIONS_TABS)[number];

/** «Лояльність → Абонементи»: вкладка в URL. */
export const subscriptionsSearchSchema = z.object({
  tab: z.enum(SUBSCRIPTIONS_TABS).default('types'),
});
