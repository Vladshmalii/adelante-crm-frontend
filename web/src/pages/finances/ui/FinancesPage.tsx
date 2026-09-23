import { DownloadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { getRouteApi } from '@tanstack/react-router';
import { App, Button, Space } from 'antd';

import { errorMessage } from '@/shared/api';
import { DateRangeFilter } from '@/shared/ui';

import { useExportFinances } from '../api/finances.mutations';
import { type FinancesSearch, type FinanceTab, period, periodToApi } from '../model/search';
import { DashboardTab } from './DashboardTab';
import { DocumentsTab } from './DocumentsTab';
import { MethodsTab } from './MethodsTab';
import { OperationsTab } from './OperationsTab';
import { ReceiptsTab } from './ReceiptsTab';

const route = getRouteApi('/_app/finances');

const TABS: { key: FinanceTab; tab: string }[] = [
  { key: 'overview', tab: 'Огляд' },
  { key: 'operations', tab: 'Операції' },
  { key: 'documents', tab: 'Документи' },
  { key: 'receipts', tab: 'Чеки' },
  { key: 'methods', tab: 'Методи оплат і каси' },
];

export function FinancesPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const { message } = App.useApp();
  const exportFinances = useExportFinances();

  const setSearch = (patch: Partial<FinancesSearch>) => {
    void navigate({ search: (prev) => ({ ...prev, ...patch }) });
  };
  const [from, to] = period(search);
  const props = { search, setSearch };

  return (
    <PageContainer
      title="Фінанси"
      tabList={TABS}
      tabActiveKey={search.tab}
      // Период общий для вкладок, остальные фильтры у каждой свои.
      onTabChange={(tab) =>
        void navigate({ search: { tab: tab as FinanceTab, from: search.from, to: search.to } })
      }
      extra={
        search.tab !== 'methods' && (
          <Space>
            <DateRangeFilter
              from={from}
              to={to}
              allowClear={false}
              onChange={(f, t) => {
                setSearch({ from: f, to: t, page: 1 });
              }}
            />
            <Button
              icon={<DownloadOutlined />}
              loading={exportFinances.isPending}
              onClick={() =>
                void exportFinances
                  .mutateAsync({ ...periodToApi(search), label: `${from}_${to}` })
                  .catch((e: unknown) => void message.error(errorMessage(e)))
              }
            >
              Експорт
            </Button>
          </Space>
        )
      }
    >
      {search.tab === 'overview' && <DashboardTab search={search} />}
      {search.tab === 'operations' && <OperationsTab {...props} />}
      {search.tab === 'documents' && <DocumentsTab {...props} />}
      {search.tab === 'receipts' && <ReceiptsTab {...props} />}
      {search.tab === 'methods' && <MethodsTab />}
    </PageContainer>
  );
}
