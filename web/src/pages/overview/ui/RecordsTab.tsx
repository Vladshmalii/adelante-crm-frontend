import { type ProColumns, ProTable } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { Select, Space, Tag, Typography } from 'antd';

import type { Schema } from '@/shared/api';
import { formatDateTime, formatMoney, formatPhone, toOptions } from '@/shared/lib';
import { staffOptions, staffRefQueryOptions } from '@/shared/refs';
import { DateRangeFilter, QueryErrorAlert } from '@/shared/ui';

import { recordsParams, recordsQueryOptions } from '../api/overview.queries';
import { paymentStatusLabels, recordStatusLabels, sourceLabels } from '../model/labels';
import type { OverviewSearch } from '../model/search';

type RecordItem = Schema<'RecordOut'>;

/** Значение фильтра мастера для записей без мастера (`withoutMaster=true`). */
const WITHOUT_MASTER = '__without_master__';

interface TabProps {
  search: OverviewSearch;
  setSearch: (patch: Partial<OverviewSearch>) => void;
}

const tagOptions = (labels: Record<string, { text: string }>) =>
  Object.entries(labels).map(([value, { text }]) => ({ value, label: text }));

export function RecordsTab({ search, setSearch }: TabProps) {
  const { data, error, isFetching, refetch } = useQuery(recordsQueryOptions(recordsParams(search)));
  const { data: masters } = useQuery(staffRefQueryOptions('master'));

  const columns: ProColumns<RecordItem>[] = [
    { title: 'Візит', key: 'startAt', render: (_, r) => formatDateTime(r.startAt) },
    {
      title: 'Клієнт',
      key: 'client',
      render: (_, r) => (
        <Space orientation="vertical" size={0}>
          <Typography.Link
            onClick={() => {
              setSearch({ recordId: r.id });
            }}
          >
            {r.client.name}
          </Typography.Link>
          <Typography.Text type="secondary">{formatPhone(r.client.phone)}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Майстер',
      key: 'master',
      render: (_, r) => r.master?.name ?? <Tag color="orange">Без майстра</Tag>,
    },
    {
      title: 'Послуги',
      key: 'services',
      render: (_, r) => (
        <Space orientation="vertical" size={0}>
          {r.services.map((s) => (
            <span key={s.id}>{s.name}</span>
          ))}
        </Space>
      ),
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, r) => (
        <Tag color={recordStatusLabels[r.status].color}>{recordStatusLabels[r.status].text}</Tag>
      ),
    },
    {
      title: 'Оплата',
      key: 'paymentStatus',
      render: (_, r) => (
        <Tag color={paymentStatusLabels[r.paymentStatus].color}>
          {paymentStatusLabels[r.paymentStatus].text}
        </Tag>
      ),
    },
    { title: 'Сума', key: 'total', align: 'right', render: (_, r) => formatMoney(r.totalAmount) },
    { title: 'Джерело', key: 'source', render: (_, r) => sourceLabels[r.source] },
    {
      title: 'Створено',
      key: 'created',
      render: (_, r) => (
        <Space orientation="vertical" size={0}>
          {formatDateTime(r.createdAt)}
          <Typography.Text type="secondary">{r.createdBy.name ?? '—'}</Typography.Text>
        </Space>
      ),
    },
  ];

  return (
    <>
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <ProTable<RecordItem>
        rowKey="id"
        columns={columns}
        dataSource={data?.data}
        loading={isFetching}
        search={false}
        columnEmptyText="—"
        scroll={{ x: 'max-content' }}
        options={{ reload: () => void refetch(), density: true, setting: true }}
        onRow={(r) => ({
          onDoubleClick: () => {
            setSearch({ recordId: r.id });
          },
        })}
        pagination={{
          current: search.page,
          pageSize: search.perPage,
          total: data?.meta?.total,
          pageSizeOptions: [25, 50, 100],
          showSizeChanger: true,
          onChange: (page, perPage) => {
            setSearch({ page, perPage });
          },
        }}
        headerTitle={
          <Space wrap>
            <DateRangeFilter
              from={search.from}
              to={search.to}
              placeholder={['Візит з', 'по']}
              onChange={(from, to) => {
                setSearch({ from, to, page: 1 });
              }}
            />
            <DateRangeFilter
              from={search.createdFrom}
              to={search.createdTo}
              placeholder={['Створено з', 'по']}
              onChange={(createdFrom, createdTo) => {
                setSearch({ createdFrom, createdTo, page: 1 });
              }}
            />
            <Select
              allowClear
              showSearch={{ optionFilterProp: 'label' }}
              placeholder="Усі майстри"
              style={{ width: 180 }}
              value={search.withoutMaster ? WITHOUT_MASTER : search.masterId}
              options={[{ value: WITHOUT_MASTER, label: 'Без майстра' }, ...staffOptions(masters)]}
              onChange={(value?: string) => {
                setSearch(
                  value === WITHOUT_MASTER
                    ? { masterId: undefined, withoutMaster: true, page: 1 }
                    : { masterId: value, withoutMaster: undefined, page: 1 },
                );
              }}
            />
            <Select
              allowClear
              placeholder="Статус візиту"
              style={{ width: 160 }}
              value={search.status}
              options={tagOptions(recordStatusLabels)}
              onChange={(status?: OverviewSearch['status']) => {
                setSearch({ status, page: 1 });
              }}
            />
            <Select
              allowClear
              placeholder="Оплата"
              style={{ width: 140 }}
              value={search.paymentStatus}
              options={tagOptions(paymentStatusLabels)}
              onChange={(paymentStatus?: OverviewSearch['paymentStatus']) => {
                setSearch({ paymentStatus, page: 1 });
              }}
            />
            <Select
              allowClear
              placeholder="Джерело"
              style={{ width: 150 }}
              value={search.source}
              options={toOptions(sourceLabels)}
              onChange={(source?: OverviewSearch['source']) => {
                setSearch({ source, page: 1 });
              }}
            />
          </Space>
        }
        toolbar={{
          search: {
            placeholder: 'Клієнт: ім’я або телефон',
            allowClear: true,
            defaultValue: search.clientQuery,
            onSearch: (clientQuery: string) => {
              setSearch({ clientQuery: clientQuery || undefined, page: 1 });
            },
          },
        }}
      />
    </>
  );
}
