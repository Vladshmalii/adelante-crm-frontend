import { PageContainer } from '@ant-design/pro-components';
import { getRouteApi } from '@tanstack/react-router';

import type { SettingsTab } from '../model/search';
import { SalonInfoTab } from './SalonInfoTab';
import { SalonScheduleTab } from './SalonScheduleTab';

const route = getRouteApi('/_app/settings');

const TABS: { key: SettingsTab; tab: string }[] = [
  { key: 'salon', tab: 'Салон' },
  { key: 'schedule', tab: 'Графік роботи' },
];

/** Налаштування салону: реквизиты и часы работы (границы смен сотрудников). */
export function SettingsPage() {
  const { tab } = route.useSearch();
  const navigate = route.useNavigate();
  return (
    <PageContainer
      title="Налаштування"
      tabList={TABS}
      tabActiveKey={tab}
      onTabChange={(key) => void navigate({ search: { tab: key as SettingsTab } })}
    >
      {tab === 'salon' ? <SalonInfoTab /> : <SalonScheduleTab />}
    </PageContainer>
  );
}
