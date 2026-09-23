import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { type ProColumns, ProTable } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { Button, Select, Space, Tag, Typography } from 'antd';
import { useState } from 'react';

import type { Schema } from '@/shared/api';
import { formatDateTime, formatMoney } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import {
  cashRegistersQueryOptions,
  operationsQueryOptions,
  paymentMethodsQueryOptions,
} from '../api/finances.queries';
import { operationStatusLabels, operationTypeLabels, tagOptions } from '../model/labels';
import { type FinancesSearch, operationsParams } from '../model/search';
import { OperationFormModal } from './OperationFormModal';

type Operation = Schema<'OperationOut'>;

interface TabProps {
  search: FinancesSearch;
  setSearch: (patch: Partial<FinancesSearch>) => void;
}

export function OperationsTab({ search, setSearch }: TabProps) {
  const { data, error, isFetching, refetch } = useQuery(
    operationsQueryOptions(operationsParams(search)),
  );
  const { data: methods } = useQuery(paymentMethodsQueryOptions());
  const { data: registers } = useQuery(cashRegistersQueryOptions());
  const [form, setForm] = useState<{ operation?: Operation } | null>(null);

  const columns: ProColumns<Operation>[] = [
    { title: 'Дата', key: 'date', render: (_, o) => formatDateTime(o.date) },
    {
      title: 'Тип',
      key: 'type',
      render: (_, o) => (
        <Tag color={operationTypeLabels[o.type].color}>{operationTypeLabels[o.type].text}</Tag>
      ),
    },
    {
      title: 'Сума',
      key: 'amount',
      align: 'right',
      render: (_, o) => (
        <Typography.Text type={o.type === 'expense' ? 'danger' : undefined}>
          {o.type === 'expense' ? '−' : ''}
          {formatMoney(o.amount)}
        </Typography.Text>
      ),
    },
    { title: 'Категорія', dataIndex: 'category' },
    { title: 'Опис', dataIndex: 'description', ellipsis: true },
    { title: 'Метод', key: 'method', render: (_, o) => o.paymentMethod?.name ?? '—' },
    { title: 'Каса', key: 'register', render: (_, o) => o.cashRegister?.name ?? '—' },
    {
      title: 'Статус',
      key: 'status',
      render: (_, o) => (
        <Tag color={operationStatusLabels[o.status].color}>
          {operationStatusLabels[o.status].text}
        </Tag>
      ),
    },
    { title: 'Автор', key: 'author', render: (_, o) => o.author.name ?? '—' },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_, o) => (
        <Button
          type="text"
          aria-label="Редагувати"
          icon={<EditOutlined />}
          onClick={() => {
            setForm({ operation: o });
          }}
        />
      ),
    },
  ];

  return (
    <>
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <ProTable<Operation>
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
            <Select
              allowClear
              placeholder="Тип операції"
              style={{ width: 150 }}
              value={search.opType}
              options={tagOptions(operationTypeLabels)}
              onChange={(opType?: FinancesSearch['opType']) => {
                setSearch({ opType, page: 1 });
              }}
            />
            <Select
              allowClear
              placeholder="Усі каси"
              style={{ width: 160 }}
              value={search.cashRegisterId}
              options={(registers ?? []).map((r) => ({ value: r.id, label: r.name }))}
              onChange={(cashRegisterId?: string) => {
                setSearch({ cashRegisterId, page: 1 });
              }}
            />
            <Select
              allowClear
              placeholder="Усі методи"
              style={{ width: 160 }}
              value={search.paymentMethodId}
              options={(methods ?? []).map((m) => ({ value: m.id, label: m.name }))}
              onChange={(paymentMethodId?: string) => {
                setSearch({ paymentMethodId, page: 1 });
              }}
            />
          </Space>
        }
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setForm({});
            }}
          >
            Нова операція
          </Button>,
        ]}
      />
      <OperationFormModal
        open={form !== null}
        operation={form?.operation}
        onOpenChange={(open) => {
          if (!open) setForm(null);
        }}
      />
    </>
  );
}
