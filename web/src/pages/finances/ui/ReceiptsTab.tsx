import { PlusOutlined, StopOutlined } from '@ant-design/icons';
import { type ProColumns, ProTable } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { App, Button, Select, Space, Tag, Typography } from 'antd';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { formatDateTime, formatMoney } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import { useCancelReceipt } from '../api/finances.mutations';
import { receiptsQueryOptions } from '../api/finances.queries';
import { receiptSourceLabels, receiptStatusLabels, tagOptions } from '../model/labels';
import { type FinancesSearch, receiptsParams } from '../model/search';
import { ReceiptFormModal } from './ReceiptFormModal';

type Receipt = Schema<'ReceiptOut'>;

interface TabProps {
  search: FinancesSearch;
  setSearch: (patch: Partial<FinancesSearch>) => void;
}

export function ReceiptsTab({ search, setSearch }: TabProps) {
  const { message, modal } = App.useApp();
  const { data, error, isFetching, refetch } = useQuery(
    receiptsQueryOptions(receiptsParams(search)),
  );
  const cancel = useCancelReceipt();
  const [createOpen, setCreateOpen] = useState(false);

  const confirmCancel = (r: Receipt) => {
    modal.confirm({
      title: `Скасувати чек № ${r.number}?`,
      content: r.recordId
        ? 'Чек і повʼязані операції буде скасовано, а візит знову стане неоплаченим. Дію не можна повернути.'
        : 'Чек і повʼязані з ним операції буде позначено скасованими. Дію не можна повернути.',
      okText: 'Скасувати чек',
      okButtonProps: { danger: true },
      cancelText: 'Назад',
      onOk: () =>
        cancel.mutateAsync(r.id).then(
          () => void message.success('Чек скасовано'),
          (e: unknown) => void message.error(errorMessage(e)),
        ),
    });
  };

  const columns: ProColumns<Receipt>[] = [
    { title: '№', dataIndex: 'number' },
    { title: 'Дата', key: 'date', render: (_, r) => formatDateTime(r.date) },
    { title: 'Клієнт', key: 'client', render: (_, r) => r.client?.name ?? '—' },
    {
      title: 'Візит',
      key: 'record',
      render: (_, r) =>
        r.recordId ? (
          <Link to="/overview" search={{ tab: 'records', recordId: r.recordId }}>
            Запис
          </Link>
        ) : (
          '—'
        ),
    },
    { title: 'Сума', key: 'amount', align: 'right', render: (_, r) => formatMoney(r.amount) },
    {
      title: 'Оплати',
      key: 'payments',
      render: (_, r) => (
        <Space orientation="vertical" size={0}>
          {r.payments.map((p, i) => (
            <Typography.Text key={i}>
              {p.method.name ?? '—'}: {formatMoney(p.amount)}
            </Typography.Text>
          ))}
        </Space>
      ),
    },
    { title: 'Каса', key: 'register', render: (_, r) => r.cashRegister.name ?? '—' },
    {
      title: 'Статус',
      key: 'status',
      render: (_, r) => (
        <Tag color={receiptStatusLabels[r.status].color}>{receiptStatusLabels[r.status].text}</Tag>
      ),
    },
    { title: 'Джерело', key: 'source', render: (_, r) => receiptSourceLabels[r.source] },
    { title: 'Автор', key: 'author', render: (_, r) => r.author.name ?? '—' },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_, r) =>
        r.status !== 'cancelled' && (
          <Button
            type="text"
            danger
            aria-label="Скасувати чек"
            icon={<StopOutlined />}
            onClick={() => {
              confirmCancel(r);
            }}
          />
        ),
    },
  ];

  return (
    <>
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <ProTable<Receipt>
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
          <Select
            allowClear
            placeholder="Статус чека"
            style={{ width: 160 }}
            value={search.receiptStatus}
            options={tagOptions(receiptStatusLabels)}
            onChange={(receiptStatus?: FinancesSearch['receiptStatus']) => {
              setSearch({ receiptStatus, page: 1 });
            }}
          />
        }
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setCreateOpen(true);
            }}
          >
            Новий чек
          </Button>,
        ]}
      />
      <ReceiptFormModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
