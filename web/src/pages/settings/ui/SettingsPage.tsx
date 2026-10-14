import { PageContainer } from '@ant-design/pro-components';
import { getRouteApi } from '@tanstack/react-router';

import { useViewer } from '@/shared/auth';

import type { SettingsTab } from '../model/search';
import { CertificatesTab } from './CertificatesTab';
import { LoyaltyTab } from './LoyaltyTab';
import { SalonInfoTab } from './SalonInfoTab';
import { SalonScheduleTab } from './SalonScheduleTab';

const route = getRouteApi('/_app/settings');

const TABS: { key: SettingsTab; tab: string }[] = [
  { key: 'salon', tab: 'Салон' },
  { key: 'schedule', tab: 'Графік роботи' },
];

/**
 * Налаштування салону: реквизиты и часы работы (границы смен сотрудников); суперюзеру —
 * ещё «Лояльність» (типы карт, уровни, бонусные правила) и «Сертифікати» (шаблоны
 * подарочных сертификатов) — общие для сети.
 */
export function SettingsPage() {
  const { tab } = route.useSearch();
  const navigate = route.useNavigate();
  const { can } = useViewer();
  const tabs = [
    ...TABS,
    ...(can.loyalty.settings ? [{ key: 'loyalty', tab: 'Лояльність' }] : []),
    ...(can.certificates.settings ? [{ key: 'certificates', tab: 'Сертифікати' }] : []),
  ];
  const active = tabs.some((t) => t.key === tab) ? tab : 'salon';
  return (
    <PageContainer
      title="Налаштування"
      tabList={tabs}
      tabActiveKey={active}
      onTabChange={(key) => void navigate({ search: { tab: key as SettingsTab } })}
    >
      {active === 'salon' && <SalonInfoTab />}
      {active === 'schedule' && <SalonScheduleTab />}
      {active === 'loyalty' && <LoyaltyTab />}
      {active === 'certificates' && <CertificatesTab />}
    </PageContainer>
  );
}
