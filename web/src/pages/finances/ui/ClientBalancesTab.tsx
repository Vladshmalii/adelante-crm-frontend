import { ProCard, ProTable, StatisticCard } from '@ant-design/pro-components';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Segmented, Tag } from 'antd';
import { useState } from 'react';

import { api, type Schema, unwrap } from '@/shared/api';
import { formatMoney, formatPhone } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';
import { AccountBalance } from '@/widgets/loyalty';

import { financesKeys } from '../api/finances.queries';

type Item = Schema<'ClientBalanceItem'>;
type Kind = 'all' | 'debt' | 'deposit';

const PER_PAGE = 25;

/**
 * «Залишки на рахунках клієнтів» (суперюзер): сумма депозитов и долгов по всей сети и список
 * клиентов с ненулевым особовим рахунком. Деньги депозитов не лежат в кассах салонов.
 */
export function ClientBalancesTab() {
  const [kind, setKind] = useState<Kind>('all');
  const [page, setPage] = useState(1);
  const { data, error, isFetching, refetch } = useQuery({
    queryKey: [...financesKeys.all, 'client-balances', kind, page],
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/finances/client-balances', {
          params: {
            query: { kind: kind === 'all' ? undefined : kind, page, perPage: PER_PAGE },
          },
          signal,
        }),
      ),
    placeholderData: keepPreviousData,
  });
  const summary = data?.data;

  return (
    <>
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <ProCard variant="outlined" style={{ marginBottom: 16 }}>
        <StatisticCard.Group direction="row">
          <StatisticCard
            statistic={{
              title: 'Депозити клієнтів',
              value: formatMoney(summary?.totalDeposits),
              description: `клієнтів: ${summary?.depositorsCount ?? 0}`,
              valueStyle: { color: 'var(--ant-color-success)' },
            }}
          />
          <StatisticCard
            statistic={{
              title: 'Борги клієнтів',
              value: formatMoney(summary?.totalDebts),
              description: `боржників: ${summary?.debtorsCount ?? 0}`,
              valueStyle: { color: 'var(--ant-color-error)' },
            }}
          />
        </StatisticCard.Group>
      </ProCard>
      <ProTable<Item>
        rowKey="clientId"
        headerTitle="Залишки на рахунках клієнтів"
        dataSource={summary?.items}
        loading={isFetching}
        search={false}
        columnEmptyText="—"
        options={{ reload: () => void refetch(), density: true }}
        toolBarRender={() => [
          <Segmented<Kind>
            key="kind"
            value={kind}
            onChange={(value) => {
              setKind(value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Усі' },
              { value: 'debt', label: 'Боржники' },
              { value: 'deposit', label: 'З депозитом' },
            ]}
          />,
        ]}
        pagination={{
          current: page,
          pageSize: PER_PAGE,
          total: data?.meta?.total,
          showSizeChanger: false,
          onChange: setPage,
        }}
        columns={[
          {
            title: 'Клієнт',
            key: 'name',
            render: (_, c) => (
              <>
                <Link to="/clients" search={{ id: c.clientId }}>
                  {c.name}
                </Link>
                {!c.isActive && <Tag style={{ marginLeft: 8 }}>видалений</Tag>}
              </>
            ),
          },
          { title: 'Телефон', key: 'phone', render: (_, c) => formatPhone(c.phone) },
          {
            title: 'Баланс',
            key: 'balance',
            align: 'right',
            render: (_, c) => <AccountBalance balance={c.balance} />,
          },
        ]}
      />
    </>
  );
}
