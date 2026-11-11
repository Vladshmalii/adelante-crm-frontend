import { PageContainer } from '@ant-design/pro-components';
import { getRouteApi } from '@tanstack/react-router';

import type { SettingsTab } from '../model/search';
import { NotificationsTab } from './NotificationsTab';
import { SalonInfoTab } from './SalonInfoTab';
import { SalonScheduleTab } from './SalonScheduleTab';

const route = getRouteApi('/_app/settings');

const TABS: { key: SettingsTab; tab: string }[] = [
  { key: 'salon', tab: 'Салон' },
  { key: 'schedule', tab: 'Графік роботи' },
  { key: 'notifications', tab: 'Нагадування' },
];

/**
 * Налаштування салону: реквизиты, часы работы (границы смен сотрудников) и время
 * напоминаний клиентам о визите. Лояльность и сертификаты — в разделе «Лояльність» (`/loyalty`).
 */
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
      {tab === 'salon' && <SalonInfoTab />}
      {tab === 'schedule' && <SalonScheduleTab />}
      {tab === 'notifications' && <NotificationsTab />}
    </PageContainer>
  );
}
