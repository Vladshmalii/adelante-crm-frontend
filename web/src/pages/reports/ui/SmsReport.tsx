import { ProCard } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { Table, Tag, Typography } from 'antd';

import type { Schema } from '@/shared/api';
import { formatMoney } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import { smsReportQueryOptions } from '../api/reports.queries';

type Row = Schema<'SmsReportRowOut'>;

interface Period {
  dateFrom: string;
  dateTo: string;
}

const COUNTERS: { key: keyof Row; title: string; tooltip?: string }[] = [
  { key: 'sms', title: 'SMS', tooltip: 'Прийняті провайдером — за них платимо' },
  { key: 'segments', title: 'Сегментів' },
  { key: 'delivered', title: 'Доставлено' },
  { key: 'undelivered', title: 'Не доставлено' },
  { key: 'pending', title: 'Очікує статусу' },
  { key: 'failed', title: 'Помилки' },
  { key: 'skipped', title: 'Пропущено', tooltip: 'Немає або неукраїнський номер' },
  { key: 'fallback', title: 'Замість Telegram', tooltip: 'SMS після невдачі Telegram' },
  { key: 'telegram', title: 'Telegram', tooltip: 'Нагадування, доставлені в Telegram' },
];

/**
 * «SMS-нагадування» — только суперюзеру: по салонам сети за период, итог по сети
 * (backend/docs/sms-reminders.md, раздел 9).
 */
export function SmsReport({ period }: { period: Period }) {
  const { data, error, isPending, refetch } = useQuery(smsReportQueryOptions(period));

  return (
    <ProCard title="SMS-нагадування" loading={isPending} variant="outlined">
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <Table<Row>
        size="small"
        rowKey={(r) => r.salonId ?? 'total'}
        pagination={false}
        scroll={{ x: 'max-content' }}
        dataSource={data?.rows}
        locale={{ emptyText: 'Немає салонів' }}
        columns={[
          {
            title: 'Салон',
            key: 'salon',
            render: (_, r) =>
              r.available ? (
                r.salonName
              ) : (
                <>
                  {r.salonName} <Tag color="red">недоступний</Tag>
                </>
              ),
          },
          ...COUNTERS.map(({ key, title, tooltip }) => ({
            title: tooltip ? <span title={tooltip}>{title}</span> : title,
            dataIndex: key,
            align: 'right' as const,
          })),
          {
            title: 'Вартість',
            key: 'cost',
            align: 'right',
            render: (_, r) => formatMoney(r.cost),
          },
        ]}
        summary={() =>
          data ? (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                <Typography.Text strong>{data.total.salonName}</Typography.Text>
              </Table.Summary.Cell>
              {COUNTERS.map(({ key }, i) => (
                <Table.Summary.Cell key={key} index={i + 1} align="right">
                  <Typography.Text strong>{String(data.total[key])}</Typography.Text>
                </Table.Summary.Cell>
              ))}
              <Table.Summary.Cell index={COUNTERS.length + 1} align="right">
                <Typography.Text strong>{formatMoney(data.total.cost)}</Typography.Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          ) : null
        }
      />
    </ProCard>
  );
}
