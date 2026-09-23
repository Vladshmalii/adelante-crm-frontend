import { type ProColumns, ProTable } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Select, Space, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';

import type { Schema } from '@/shared/api';
import { useViewer } from '@/shared/auth';
import { formatDateTime, toOptions } from '@/shared/lib';
import { staffOptions, staffRefQueryOptions } from '@/shared/refs';
import { ChangeDetails, DateRangeFilter, QueryErrorAlert } from '@/shared/ui';

import { auditParams, auditQueryOptions } from '../api/overview.queries';
import { auditActionLabels, auditEntityLabels } from '../model/labels';
import type { OverviewSearch } from '../model/search';

type Change = Schema<'AuditOut'>;

interface TabProps {
  search: OverviewSearch;
  setSearch: (patch: Partial<OverviewSearch>) => void;
}

export function ChangesTab({ search, setSearch }: TabProps) {
  const { viewer } = useViewer();
  const { data, error, isFetching, refetch } = useQuery(auditQueryOptions(auditParams(search)));
  const { data: staff } = useQuery(staffRefQueryOptions());

  /** Ссылка на объект изменения; удалённые объекты и недоступные разделы — просто текст. */
  const objectLink = (c: Change): ReactNode => {
    if (c.action === 'deleted') return c.entityName;
    switch (c.entity) {
      case 'record':
        return (
          <Typography.Link
            onClick={() => {
              setSearch({ recordId: c.entityId });
            }}
          >
            {c.entityName}
          </Typography.Link>
        );
      case 'client':
        return (
          <Link to="/clients" search={{ id: c.entityId }}>
            {c.entityName}
          </Link>
        );
      case 'service':
        return <Link to="/services">{c.entityName}</Link>;
      case 'staff':
        return <Link to="/staff">{c.entityName}</Link>;
      case 'finance':
        return viewer.isSuperuser ? <Link to="/finances">{c.entityName}</Link> : c.entityName;
      default:
        return c.entityName;
    }
  };

  const columns: ProColumns<Change>[] = [
    { title: 'Дата', key: 'createdAt', render: (_, c) => formatDateTime(c.createdAt) },
    {
      title: 'Сутність',
      key: 'entity',
      render: (_, c) => <Tag>{auditEntityLabels[c.entity] ?? c.entity}</Tag>,
    },
    { title: "Об'єкт", key: 'object', render: (_, c) => objectLink(c) },
    {
      title: 'Дія',
      key: 'action',
      render: (_, c) => (
        <Tag color={auditActionLabels[c.action].color}>{auditActionLabels[c.action].text}</Tag>
      ),
    },
    { title: 'Автор', key: 'author', render: (_, c) => c.author.name ?? 'Система' },
    {
      title: 'Деталі',
      key: 'details',
      render: (_, c) => <ChangeDetails details={c.details} />,
    },
  ];

  return (
    <>
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <ProTable<Change>
        rowKey="id"
        columns={columns}
        dataSource={data?.data}
        loading={isFetching}
        search={false}
        columnEmptyText="—"
        scroll={{ x: 'max-content' }}
        options={{ reload: () => void refetch(), density: true, setting: true }}
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
              onChange={(from, to) => {
                setSearch({ from, to, page: 1 });
              }}
            />
            <Select
              allowClear
              placeholder="Сутність"
              style={{ width: 150 }}
              value={search.entity}
              options={toOptions(auditEntityLabels)}
              onChange={(entity?: string) => {
                setSearch({ entity, page: 1 });
              }}
            />
            <Select
              allowClear
              placeholder="Дія"
              style={{ width: 140 }}
              value={search.action}
              options={Object.entries(auditActionLabels).map(([value, { text }]) => ({
                value,
                label: text,
              }))}
              onChange={(action?: OverviewSearch['action']) => {
                setSearch({ action, page: 1 });
              }}
            />
            <Select
              allowClear
              showSearch={{ optionFilterProp: 'label' }}
              placeholder="Автор"
              style={{ width: 180 }}
              value={search.authorId}
              options={staffOptions(staff)}
              onChange={(authorId?: string) => {
                setSearch({ authorId, page: 1 });
              }}
            />
          </Space>
        }
      />
    </>
  );
}
