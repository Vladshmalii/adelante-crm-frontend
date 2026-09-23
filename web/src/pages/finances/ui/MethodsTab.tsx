import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { ProCard, type ProColumns, ProTable, StatisticCard } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { App, Button, Empty, Switch, Tag } from 'antd';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { formatMoney } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import { useUpdatePaymentMethod } from '../api/finances.mutations';
import { cashRegistersQueryOptions, paymentMethodsQueryOptions } from '../api/finances.queries';
import { commissionPayerLabels, methodTypeLabels } from '../model/labels';
import { CashRegisterFormModal } from './CashRegisterFormModal';
import { PaymentMethodFormModal } from './PaymentMethodFormModal';

type Method = Schema<'PaymentMethodOut'>;

const commission = (m: Method) =>
  m.commissionType === 'none'
    ? 'Без комісії'
    : `${m.commissionType === 'percentage' ? `${Number(m.commissionValue)}%` : formatMoney(m.commissionValue)} · ${commissionPayerLabels[m.commissionPayer]}`;

export function MethodsTab() {
  const { message } = App.useApp();
  const methods = useQuery(paymentMethodsQueryOptions());
  const registers = useQuery(cashRegistersQueryOptions());
  const update = useUpdatePaymentMethod();
  const [form, setForm] = useState<{ method?: Method } | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  const registerName = (id: string | null) => registers.data?.find((r) => r.id === id)?.name ?? '—';

  const columns: ProColumns<Method>[] = [
    { title: 'Назва', dataIndex: 'name' },
    { title: 'Тип', key: 'type', render: (_, m) => methodTypeLabels[m.type] },
    { title: 'Каса', key: 'register', render: (_, m) => registerName(m.cashRegisterId) },
    { title: 'Комісія', key: 'commission', render: (_, m) => commission(m) },
    {
      title: 'Онлайн',
      key: 'online',
      render: (_, m) => (m.availableOnline ? <Tag color="blue">Так</Tag> : 'Ні'),
    },
    {
      title: 'Активний',
      key: 'active',
      render: (_, m) => (
        <Switch
          size="small"
          checked={m.isActive}
          onChange={(isActive) =>
            void update
              .mutateAsync({ id: m.id, body: { isActive } })
              .catch((e: unknown) => void message.error(errorMessage(e)))
          }
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_, m) => (
        <Button
          type="text"
          aria-label="Редагувати"
          icon={<EditOutlined />}
          onClick={() => {
            setForm({ method: m });
          }}
        />
      ),
    },
  ];

  return (
    <>
      <QueryErrorAlert
        error={methods.error ?? registers.error}
        onRetry={() => void methods.refetch()}
      />
      <ProCard
        title="Каси"
        variant="outlined"
        style={{ marginBottom: 16 }}
        extra={
          <Button
            icon={<PlusOutlined />}
            onClick={() => {
              setRegisterOpen(true);
            }}
          >
            Нова каса
          </Button>
        }
      >
        {registers.data?.length ? (
          <StatisticCard.Group direction="row">
            {registers.data.map((r) => (
              <StatisticCard
                key={r.id}
                statistic={{
                  title: r.isActive ? r.name : `${r.name} (неактивна)`,
                  value: formatMoney(r.balance),
                  description: r.location,
                }}
              />
            ))}
          </StatisticCard.Group>
        ) : (
          <Empty description="Кас ще немає" />
        )}
      </ProCard>

      <ProTable<Method>
        rowKey="id"
        headerTitle="Методи оплати"
        columns={columns}
        dataSource={methods.data}
        loading={methods.isFetching}
        search={false}
        pagination={false}
        columnEmptyText="—"
        scroll={{ x: 'max-content' }}
        options={{ reload: () => void methods.refetch(), density: true, setting: true }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setForm({});
            }}
          >
            Новий метод
          </Button>,
        ]}
      />

      <PaymentMethodFormModal
        open={form !== null}
        method={form?.method}
        onOpenChange={(open) => {
          if (!open) setForm(null);
        }}
      />
      <CashRegisterFormModal open={registerOpen} onOpenChange={setRegisterOpen} />
    </>
  );
}
