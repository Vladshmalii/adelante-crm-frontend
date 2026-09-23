import { PageContainer } from '@ant-design/pro-components';
import { getRouteApi } from '@tanstack/react-router';

import type { OverviewSearch, OverviewTab } from '../model/search';
import { ChangesTab } from './ChangesTab';
import { RecordDrawer } from './RecordDrawer';
import { RecordsTab } from './RecordsTab';
import { ReviewsTab } from './ReviewsTab';

const route = getRouteApi('/_app/overview');

const TABS: { key: OverviewTab; tab: string }[] = [
  { key: 'records', tab: 'Записи' },
  { key: 'reviews', tab: 'Відгуки' },
  { key: 'changes', tab: 'Журнал змін' },
];

export function OverviewPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();

  const setSearch = (patch: Partial<OverviewSearch>) => {
    void navigate({ search: (prev) => ({ ...prev, ...patch }) });
  };
  const props = { search, setSearch };

  return (
    <PageContainer
      title="Огляд"
      tabList={TABS}
      tabActiveKey={search.tab}
      // Фильтры у вкладок разные — при переключении начинаем с чистого листа.
      onTabChange={(tab) => void navigate({ search: { tab: tab as OverviewTab } })}
    >
      {search.tab === 'records' && <RecordsTab {...props} />}
      {search.tab === 'reviews' && <ReviewsTab {...props} />}
      {search.tab === 'changes' && <ChangesTab {...props} />}
      <RecordDrawer
        recordId={search.recordId}
        onClose={() => {
          setSearch({ recordId: undefined });
        }}
      />
    </PageContainer>
  );
}
