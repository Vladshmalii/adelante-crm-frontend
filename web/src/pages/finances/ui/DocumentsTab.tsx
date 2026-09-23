import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { type ProColumns, ProTable } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { Button, Select, Space, Tag } from 'antd';
import { useState } from 'react';

import type { Schema } from '@/shared/api';
import { formatDate, formatMoney, inSalonTz, toOptions } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import { documentsQueryOptions } from '../api/finances.queries';
import {
  contentTypeLabels,
  documentStatusLabels,
  documentTypeLabels,
  tagOptions,
} from '../model/labels';
import { documentsParams, type FinancesSearch } from '../model/search';
import { DocumentFormModal } from './DocumentFormModal';

type Document = Schema<'DocumentOut'>;

interface TabProps {
  search: FinancesSearch;
  setSearch: (patch: Partial<FinancesSearch>) => void;
}

export function DocumentsTab({ search, setSearch }: TabProps) {
  const { data, error, isFetching, refetch } = useQuery(
    documentsQueryOptions(documentsParams(search)),
  );
  const [form, setForm] = useState<{ document?: Document } | null>(null);

  const columns: ProColumns<Document>[] = [
    { title: '№', dataIndex: 'number' },
    {
      title: 'Дата',
      key: 'date',
      render: (_, d) => formatDate(inSalonTz(d.date).format('YYYY-MM-DD')),
    },
    { title: 'Тип', key: 'type', render: (_, d) => documentTypeLabels[d.type] },
    { title: 'Вміст', key: 'contentType', render: (_, d) => contentTypeLabels[d.contentType] },
    { title: 'Сума', key: 'amount', align: 'right', render: (_, d) => formatMoney(d.amount) },
    { title: 'Контрагент', dataIndex: 'counterparty', ellipsis: true },
    { title: 'Коментар', dataIndex: 'comment', ellipsis: true },
    {
      title: 'Статус',
      key: 'status',
      render: (_, d) => (
        <Tag color={documentStatusLabels[d.status].color}>
          {documentStatusLabels[d.status].text}
        </Tag>
      ),
    },
    { title: 'Автор', key: 'author', render: (_, d) => d.author.name ?? '—' },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_, d) => (
        <Button
          type="text"
          aria-label="Редагувати"
          icon={<EditOutlined />}
          onClick={() => {
            setForm({ document: d });
          }}
        />
      ),
    },
  ];

  return (
    <>
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <ProTable<Document>
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
              placeholder="Тип документа"
              style={{ width: 170 }}
              value={search.docType}
              options={toOptions(documentTypeLabels)}
              onChange={(docType?: FinancesSearch['docType']) => {
                setSearch({ docType, page: 1 });
              }}
            />
            <Select
              allowClear
              placeholder="Статус"
              style={{ width: 150 }}
              value={search.docStatus}
              options={tagOptions(documentStatusLabels)}
              onChange={(docStatus?: FinancesSearch['docStatus']) => {
                setSearch({ docStatus, page: 1 });
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
            Новий документ
          </Button>,
        ]}
      />
      <DocumentFormModal
        open={form !== null}
        document={form?.document}
        onOpenChange={(open) => {
          if (!open) setForm(null);
        }}
      />
    </>
  );
}
