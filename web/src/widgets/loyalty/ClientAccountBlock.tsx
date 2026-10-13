import { MinusOutlined, PlusOutlined, ToolOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { App, Button, Card, Empty, Space, Statistic, Table, Tag, Typography } from 'antd';
import { useState } from 'react';

import { api, errorMessage, type Schema, unwrap } from '@/shared/api';
import { useViewer } from '@/shared/auth';
import { formatDateTime, formatMoney } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import {
  accountQueryOptions,
  accountTransactionsQueryOptions,
  newOperationKey,
  TXNS_PER_PAGE,
  useAdjustAccount,
  useRefund,
  useTopup,
} from './api';
import { balanceKind, transactionTypeLabels } from './model';

type Txn = Schema<'TransactionOut'>;
type Operation = 'topup' | 'refund' | 'adjustment';

/** Баланс особового рахунку: зелёный — депозит, красный — «Борг». */
export function AccountBalance({ balance }: { balance: string | number }) {
  const kind = balanceKind(balance);
  if (kind === 'debt') {
    return (
      <Typography.Text type="danger" strong>
        Борг {formatMoney(Math.abs(Number(balance)))}
      </Typography.Text>
    );
  }
  return (
    <Typography.Text type={kind === 'deposit' ? 'success' : undefined} strong>
      {formatMoney(balance)}
    </Typography.Text>
  );
}

/** Журнал операций по счёту (особовий рахунок или кешбэк карты). */
export function TransactionsTable({
  data,
  loading,
  pagination,
}: {
  data: Txn[] | undefined;
  loading: boolean;
  pagination?: { current: number; total: number; onChange: (page: number) => void };
}) {
  return (
    <Table<Txn>
      size="small"
      rowKey="id"
      loading={loading}
      dataSource={data}
      locale={{ emptyText: <Empty description="Операцій ще немає" /> }}
      pagination={
        pagination && pagination.total > TXNS_PER_PAGE
          ? { pageSize: TXNS_PER_PAGE, showSizeChanger: false, ...pagination }
          : false
      }
      columns={[
        { title: 'Коли', key: 'date', render: (_, t) => formatDateTime(t.createdAt) },
        {
          title: 'Операція',
          key: 'type',
          render: (_, t) => (
            <Tag color={transactionTypeLabels[t.type].color}>
              {transactionTypeLabels[t.type].text}
            </Tag>
          ),
        },
        {
          title: 'Сума',
          key: 'amount',
          align: 'right',
          render: (_, t) => (
            <Typography.Text type={Number(t.amount) < 0 ? 'danger' : 'success'}>
              {Number(t.amount) > 0 ? '+' : ''}
              {formatMoney(t.amount)}
            </Typography.Text>
          ),
        },
        {
          title: 'Залишок',
          key: 'after',
          align: 'right',
          render: (_, t) => formatMoney(t.balanceAfter),
        },
        { title: 'Салон', key: 'salon', render: (_, t) => t.salon?.name ?? '—' },
        {
          title: 'Хто',
          key: 'author',
          render: (_, t) =>
            [t.author.name, t.staff?.name && `співробітник: ${t.staff.name}`]
              .filter(Boolean)
              .join(' · ') || '—',
        },
        { title: 'Коментар', key: 'comment', render: (_, t) => t.comment ?? '—' },
      ]}
    />
  );
}

/**
 * Блок «Рахунок» в карточке клиента: баланс, «Поповнити», «Повернути кошти», история.
 * Пополнение и возврат не трогают кассы салона — деньги только на счёте клиента.
 */
export function ClientAccountBlock({ clientId }: { clientId: string }) {
  const { can } = useViewer();
  const [page, setPage] = useState(1);
  const [operation, setOperation] = useState<Operation | null>(null);
  const account = useQuery(accountQueryOptions(clientId));
  const txns = useQuery(accountTransactionsQueryOptions(clientId, page));
  const balance = account.data?.balance ?? 0;

  return (
    <Card
      size="small"
      title="Рахунок"
      extra={
        <Space>
          {can.loyalty.manage && (
            <>
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => {
                  setOperation('topup');
                }}
              >
                Поповнити
              </Button>
              <Button
                size="small"
                icon={<MinusOutlined />}
                disabled={balanceKind(balance) !== 'deposit'}
                onClick={() => {
                  setOperation('refund');
                }}
              >
                Повернути кошти
              </Button>
            </>
          )}
          {can.loyalty.adjust && (
            <Button
              size="small"
              icon={<ToolOutlined />}
              onClick={() => {
                setOperation('adjustment');
              }}
            >
              Коригування
            </Button>
          )}
        </Space>
      }
    >
      <QueryErrorAlert error={account.error ?? txns.error} onRetry={() => void account.refetch()} />
      <Statistic
        title={balanceKind(balance) === 'debt' ? 'Борг клієнта' : 'Депозит'}
        value={Math.abs(Number(balance))}
        precision={2}
        suffix="₴"
        styles={{
          content: {
            color:
              balanceKind(balance) === 'debt'
                ? 'var(--ant-color-error)'
                : balanceKind(balance) === 'deposit'
                  ? 'var(--ant-color-success)'
                  : undefined,
          },
        }}
        loading={account.isPending}
        style={{ marginBottom: 12 }}
      />
      <TransactionsTable
        data={txns.data?.data}
        loading={txns.isFetching}
        pagination={{ current: page, total: txns.data?.meta?.total ?? 0, onChange: setPage }}
      />
      <AccountOperationModal
        clientId={clientId}
        operation={operation}
        balance={Number(balance)}
        onClose={() => {
          setOperation(null);
        }}
      />
    </Card>
  );
}

const TITLES: Record<Operation, string> = {
  topup: 'Поповнення рахунку',
  refund: 'Повернення коштів клієнту',
  adjustment: 'Коригування рахунку',
};

interface OperationValues {
  amount: number;
  staffId?: string;
  comment?: string;
}

function AccountOperationModal({
  clientId,
  operation,
  balance,
  onClose,
}: {
  clientId: string;
  operation: Operation | null;
  balance: number;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const topup = useTopup(clientId);
  const refund = useRefund(clientId);
  const adjust = useAdjustAccount(clientId);
  // Новый ключ на каждое открытие: повтор отправки той же формы — одна операция
  const [key, setKey] = useState(newOperationKey);
  const staff = useQuery({
    queryKey: ['staff', 'loyalty-picker'],
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/staff', { params: { query: { perPage: 200 } }, signal }))
        .data,
    enabled: operation === 'topup',
    staleTime: 60_000,
  });

  return (
    <ModalForm<OperationValues>
      title={operation ? TITLES[operation] : ''}
      open={operation !== null}
      width={460}
      modalProps={{ destroyOnHidden: true, onCancel: onClose }}
      onOpenChange={(open) => {
        if (open) setKey(newOperationKey());
        else onClose();
      }}
      submitter={{ searchConfig: { submitText: 'Провести', resetText: 'Скасувати' } }}
      onFinish={async (v) => {
        try {
          if (operation === 'topup') {
            await topup.mutateAsync({
              key,
              body: { amount: v.amount, staffId: v.staffId ?? null, comment: v.comment ?? null },
            });
          } else if (operation === 'refund') {
            await refund.mutateAsync({
              key,
              body: { amount: v.amount, comment: v.comment ?? null },
            });
          } else if (operation === 'adjustment') {
            await adjust.mutateAsync({ key, body: { amount: v.amount, comment: v.comment ?? '' } });
          }
          message.success('Операцію проведено');
          return true;
        } catch (error) {
          message.error(errorMessage(error));
          return false;
        }
      }}
    >
      {operation === 'adjustment' ? (
        <Typography.Paragraph type="secondary">
          Сума зі знаком: «+» — на рахунок, «−» — з рахунку. Коментар обовʼязковий.
        </Typography.Paragraph>
      ) : (
        <Typography.Paragraph type="secondary">
          Каса салону не змінюється — гроші лише на рахунку клієнта.
          {operation === 'refund' && ` Можна повернути до ${formatMoney(Math.max(balance, 0))}.`}
        </Typography.Paragraph>
      )}
      <ProFormDigit
        name="amount"
        label="Сума"
        min={operation === 'adjustment' ? undefined : 0.01}
        max={operation === 'refund' ? Math.max(balance, 0) : undefined}
        fieldProps={{ suffix: '₴', precision: 2 }}
        rules={[{ required: true, message: 'Вкажіть суму' }]}
      />
      {operation === 'topup' && (
        <ProFormSelect
          name="staffId"
          label="Співробітник"
          showSearch
          placeholder="Необовʼязково"
          options={(staff.data ?? []).map((s) => ({
            value: s.id,
            label: [s.firstName, s.lastName].filter(Boolean).join(' '),
          }))}
        />
      )}
      <ProFormTextArea
        name="comment"
        label="Коментар"
        rules={
          operation === 'adjustment' ? [{ required: true, message: 'Вкажіть причину' }] : undefined
        }
      />
    </ModalForm>
  );
}
