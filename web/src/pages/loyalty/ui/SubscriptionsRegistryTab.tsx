import { type ProColumns, ProTable } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { Input, Select, Space, Tag, Typography } from 'antd';
import { useState } from 'react';

import type { Schema } from '@/shared/api';
import { meQueryOptions } from '@/shared/auth';
import { formatDateTime, useDebouncedValue } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';
import {
  balanceLabel,
  frozenUntilLabel,
  serviceBalances,
  subscriptionsRegistryQueryOptions,
  subscriptionStatusLabels,
  subscriptionTypesQueryOptions,
  validUntilLabel,
} from '@/widgets/subscriptions';

type Subscription = Schema<'SubscriptionOut'>;
type Status = Schema<'SubscriptionStatus'>;

const PER_PAGE = 25;

/**
 * «Лояльність → Абонементи → Продані абонементи» (суперюзер, frontend-subscriptions.md, 2.1):
 * реестр сети — статус, тип, салон-продавец, поиск по названию, имени или телефону клиента.
 */
export function SubscriptionsRegistryTab() {
  const me = useQuery(meQueryOptions);
  const types = useQuery(subscriptionTypesQueryOptions());
  const salons = me.data?.salons ?? [];
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q);
  const [status, setStatus] = useState<Status>();
  const [typeId, setTypeId] = useState<string>();
  const [salonId, setSalonId] = useState<string>();
  const [page, setPage] = useState(1);
  const registry = useQuery(
    subscriptionsRegistryQueryOptions({
      q: debouncedQ.trim(),
      status,
      typeId,
      salonId,
      page,
      perPage: PER_PAGE,
    }),
  );

  const columns: ProColumns<Subscription>[] = [
    { title: 'Клієнт', key: 'client', render: (_, s) => s.client.name ?? '—' },
    {
      title: 'Абонемент',
      key: 'name',
      render: (_, s) => (
        <Space orientation="vertical" size={0}>
          {s.name}
          <Typography.Text type="secondary">
            {s.soldSalonName ?? '—'} · {formatDateTime(s.soldAt)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Залишок',
      key: 'balance',
      render: (_, s) => (
        <Space orientation="vertical" size={0}>
          {balanceLabel(s)}
          {serviceBalances(s).map((line) => (
            <Typography.Text key={line} type="secondary">
              {line}
            </Typography.Text>
          ))}
        </Space>
      ),
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, s) => (
        <Space orientation="vertical" size={0}>
          <Tag color={subscriptionStatusLabels[s.status].color}>
            {subscriptionStatusLabels[s.status].text}
          </Tag>
          {frozenUntilLabel(s) && (
            <Typography.Text type="secondary">заморожено {frozenUntilLabel(s)}</Typography.Text>
          )}
          {s.cancelReason && <Typography.Text type="secondary">{s.cancelReason}</Typography.Text>}
        </Space>
      ),
    },
    { title: 'Діє до', key: 'expires', render: (_, s) => validUntilLabel(s) },
  ];

  return (
    <>
      <QueryErrorAlert error={registry.error} onRetry={() => void registry.refetch()} />
      <ProTable<Subscription>
        rowKey="id"
        headerTitle="Абонементи мережі"
        columns={columns}
        dataSource={registry.data?.data}
        loading={registry.isFetching}
        search={false}
        columnEmptyText="—"
        scroll={{ x: 'max-content' }}
        options={{ reload: () => void registry.refetch(), density: true }}
        toolBarRender={() => [
          <Input.Search
            key="q"
            allowClear
            placeholder="Назва, клієнт або телефон"
            style={{ width: 240 }}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />,
          <Select<Status>
            key="status"
            allowClear
            placeholder="Статус"
            style={{ width: 170 }}
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={(Object.keys(subscriptionStatusLabels) as Status[]).map((value) => ({
              value,
              label: subscriptionStatusLabels[value].text,
            }))}
          />,
          <Select<string>
            key="type"
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            placeholder="Тип"
            style={{ width: 200 }}
            value={typeId}
            onChange={(value) => {
              setTypeId(value);
              setPage(1);
            }}
            options={(types.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
          />,
          <Select<string>
            key="salon"
            allowClear
            placeholder="Салон продажу"
            style={{ width: 200 }}
            value={salonId}
            onChange={(value) => {
              setSalonId(value);
              setPage(1);
            }}
            options={salons.map((s) => ({ value: s.id, label: s.name }))}
          />,
        ]}
        pagination={{
          current: page,
          pageSize: PER_PAGE,
          total: registry.data?.meta?.total ?? 0,
          showSizeChanger: false,
          onChange: setPage,
        }}
      />
    </>
  );
}
