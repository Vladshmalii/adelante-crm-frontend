import {
  EditOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SwapOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { ProCard, type ProColumns, ProTable, StatisticCard } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { App, Button, Empty, Space, Switch, Tag } from 'antd';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { formatMoney } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import { useUpdatePaymentMethod } from '../api/finances.mutations';
import { cashRegistersQueryOptions, paymentMethodsQueryOptions } from '../api/finances.queries';
import { commissionPayerLabels, methodTypeLabels } from '../model/labels';
import { CashMovementModal, type CashMovementKind } from './CashMovementModal';
import { CashRegisterFormModal } from './CashRegisterFormModal';
import { ExpenseCategoriesModal } from './ExpenseCategoriesModal';
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
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [movement, setMovement] = useState<{
    kind: CashMovementKind;
    cashRegisterId: string;
  } | null>(null);
  const activeRegisters = registers.data?.filter((r) => r.isActive).length ?? 0;

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
          <Space>
            <Button
              icon={<TagsOutlined />}
              onClick={() => {
                setCategoriesOpen(true);
              }}
            >
              Категорії витрат
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={() => {
                setRegisterOpen(true);
              }}
            >
              Нова каса
            </Button>
          </Space>
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
                footer={
                  r.isActive && (
                    <Space wrap>
                      <Button
                        size="small"
                        icon={<MinusCircleOutlined />}
                        onClick={() => {
                          setMovement({ kind: 'expense', cashRegisterId: r.id });
                        }}
                      >
                        Витрата
                      </Button>
                      <Button
                        size="small"
                        icon={<SwapOutlined />}
                        disabled={activeRegisters < 2}
                        title={activeRegisters < 2 ? 'Потрібна ще одна активна каса' : undefined}
                        onClick={() => {
                          setMovement({ kind: 'transfer', cashRegisterId: r.id });
                        }}
                      >
                        Переказ
                      </Button>
                    </Space>
                  )
                }
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
      <CashMovementModal
        movement={movement}
        onClose={() => {
          setMovement(null);
        }}
      />
      <ExpenseCategoriesModal
        open={categoriesOpen}
        onClose={() => {
          setCategoriesOpen(false);
        }}
      />
    </>
  );
}
