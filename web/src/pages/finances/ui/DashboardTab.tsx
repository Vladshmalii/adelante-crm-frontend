import { Bar, Column, Pie } from '@ant-design/plots';
import { ProCard, StatisticCard } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { Col, Empty, Row, Table } from 'antd';
import dayjs from 'dayjs';

import { formatMoney } from '@/shared/lib';
import { usePreferencesStore } from '@/shared/preferences';
import { QueryErrorAlert } from '@/shared/ui';

import { dashboardQueryOptions } from '../api/finances.queries';
import { methodTypeLabels } from '../model/labels';
import { type FinancesSearch, periodToApi } from '../model/search';

export function DashboardTab({ search }: { search: FinancesSearch }) {
  const { dateFrom, dateTo } = periodToApi(search);
  const { data, error, isPending, refetch } = useQuery(dashboardQueryOptions(dateFrom, dateTo));
  const theme = usePreferencesStore((s) => (s.themeMode === 'dark' ? 'classicDark' : 'classic'));

  const revenueByDay = (data?.revenueByDay ?? []).map((d) => ({
    day: dayjs(d.date).format('DD.MM'),
    amount: Number(d.amount),
  }));
  const paymentSplit = (data?.paymentSplit ?? []).map((p) => ({
    method: methodTypeLabels[p.methodType],
    amount: Number(p.amount),
  }));
  const expenses = (data?.expensesByCategory ?? []).map((e) => ({
    category: e.category || 'Без категорії',
    amount: Number(e.amount),
  }));
  const moneyTooltip = { items: [{ channel: 'y', valueFormatter: (v: number) => formatMoney(v) }] };

  return (
    <>
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <StatisticCard.Group direction="row" loading={isPending} style={{ marginBottom: 16 }}>
        <StatisticCard statistic={{ title: 'Дохід', value: formatMoney(data?.totalRevenue) }} />
        <StatisticCard statistic={{ title: 'Витрати', value: formatMoney(data?.totalExpenses) }} />
        <StatisticCard
          statistic={{
            title: 'Чистий прибуток',
            value: formatMoney(data?.netIncome),
            styles: {
              content: data && Number(data.netIncome) < 0 ? { color: '#cf1322' } : undefined,
            },
          }}
        />
      </StatisticCard.Group>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <ProCard title="Виручка по днях" loading={isPending} variant="outlined">
            {revenueByDay.length ? (
              <Column
                height={280}
                theme={theme}
                data={revenueByDay}
                xField="day"
                yField="amount"
                axis={{ y: { labelFormatter: (v: number) => `${v / 1000}k` } }}
                tooltip={moneyTooltip}
              />
            ) : (
              <Empty description="Немає виручки за період" />
            )}
          </ProCard>
        </Col>
        <Col xs={24} xl={8}>
          <ProCard title="Оплати за методами" loading={isPending} variant="outlined">
            {paymentSplit.length ? (
              <Pie
                height={280}
                theme={theme}
                data={paymentSplit}
                angleField="amount"
                colorField="method"
                innerRadius={0.6}
                legend={{ color: { position: 'bottom', layout: { justifyContent: 'center' } } }}
                tooltip={{
                  items: [{ channel: 'y', valueFormatter: (v: number) => formatMoney(v) }],
                }}
              />
            ) : (
              <Empty description="Оплат немає" />
            )}
          </ProCard>
        </Col>
        <Col xs={24} xl={12}>
          <ProCard title="Витрати за категоріями" loading={isPending} variant="outlined">
            {expenses.length ? (
              <Bar
                height={260}
                theme={theme}
                data={expenses}
                xField="category"
                yField="amount"
                tooltip={moneyTooltip}
              />
            ) : (
              <Empty description="Витрат немає" />
            )}
          </ProCard>
        </Col>
        <Col xs={24} xl={12}>
          <ProCard title="Топ послуг" loading={isPending} variant="outlined">
            <Table
              size="small"
              rowKey="name"
              pagination={false}
              dataSource={data?.topServices}
              locale={{ emptyText: 'Немає даних' }}
              columns={[
                { title: 'Послуга', dataIndex: 'name' },
                { title: 'Візитів', dataIndex: 'count', align: 'right' },
                {
                  title: 'Виручка',
                  dataIndex: 'revenue',
                  align: 'right',
                  render: (v: string) => formatMoney(v),
                },
              ]}
            />
          </ProCard>
        </Col>
      </Row>
    </>
  );
}
