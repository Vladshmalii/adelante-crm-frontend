import { DownloadOutlined } from '@ant-design/icons';
import { Column, Line, Pie } from '@ant-design/plots';
import { PageContainer, ProCard, StatisticCard } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { App, Button, Col, Empty, Row, Segmented, Space, Table, Typography } from 'antd';

import { errorMessage, type Schema } from '@/shared/api';
import { useViewer } from '@/shared/auth';
import { formatMoney, serviceCategoryLabel } from '@/shared/lib';
import { usePreferencesStore } from '@/shared/preferences';
import { DateRangeFilter, QueryErrorAlert } from '@/shared/ui';

import {
  clientsReportQueryOptions,
  revenueQueryOptions,
  servicesReportQueryOptions,
  staffReportQueryOptions,
  summaryQueryOptions,
  useExportReports,
} from '../api/reports.queries';
import { formatChange, periodLabel } from '../model/format';
import { type GroupBy, period, periodToApi, type ReportsSearch } from '../model/search';

type Metric = Schema<'MetricOut'>;

const route = getRouteApi('/_app/reports');

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'day', label: 'Дні' },
  { value: 'week', label: 'Тижні' },
  { value: 'month', label: 'Місяці' },
];

export function ReportsPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const { message } = App.useApp();
  const { can } = useViewer();
  const exportReports = useExportReports();

  const setSearch = (patch: Partial<ReportsSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }) });
  const [from, to] = period(search);
  const api = periodToApi(search);

  return (
    <PageContainer
      title="Звіти"
      extra={
        <Space wrap>
          <DateRangeFilter
            from={from}
            to={to}
            allowClear={false}
            onChange={(f, t) => {
              setSearch({ from: f, to: t });
            }}
          />
          <Segmented<GroupBy>
            options={GROUP_OPTIONS}
            value={search.groupBy}
            onChange={(groupBy) => {
              setSearch({ groupBy });
            }}
          />
          <Button
            icon={<DownloadOutlined />}
            loading={exportReports.isPending}
            onClick={() =>
              void exportReports
                .mutateAsync({ ...api, groupBy: search.groupBy, label: `${from}_${to}` })
                .catch((e: unknown) => void message.error(errorMessage(e)))
            }
          >
            Експорт
          </Button>
        </Space>
      }
    >
      <Summary period={api} />
      <Row gutter={[16, 16]}>
        {can.reports.viewMoney && (
          <Col xs={24}>
            <RevenueChart period={api} groupBy={search.groupBy} />
          </Col>
        )}
        <Col xs={24}>
          <ClientsChart period={api} groupBy={search.groupBy} />
        </Col>
        <Col xs={24}>
          <StaffTable period={api} />
        </Col>
        <Col xs={24}>
          <ServicesBlock period={api} />
        </Col>
      </Row>
    </PageContainer>
  );
}

interface Period {
  dateFrom: string;
  dateTo: string;
}

function useChartTheme() {
  return usePreferencesStore((s) => (s.themeMode === 'dark' ? 'classicDark' : 'classic'));
}

/** Изменение к предыдущему периоду: рост — зелёным, падение — красным. */
function Change({ metric }: { metric: Metric }) {
  const text = formatChange(metric.changePercent);
  if (text === null)
    return <Typography.Text type="secondary">немає з чим порівняти</Typography.Text>;
  const type =
    metric.changePercent === 0
      ? 'secondary'
      : (metric.changePercent ?? 0) > 0
        ? 'success'
        : 'danger';
  return (
    <Typography.Text type={type}>
      {text} <Typography.Text type="secondary">до попереднього періоду</Typography.Text>
    </Typography.Text>
  );
}

function Summary({ period }: { period: Period }) {
  const { data, error, isPending, refetch } = useQuery(summaryQueryOptions(period));
  const cards: { title: string; metric: Metric | null | undefined; money?: boolean }[] = [
    { title: 'Виручка', metric: data?.revenue, money: true },
    { title: 'Середній чек', metric: data?.avgCheck, money: true },
    { title: 'Клієнти', metric: data?.clients },
    { title: 'Записи', metric: data?.records },
  ];

  return (
    <>
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <StatisticCard.Group direction="row" loading={isPending} style={{ marginBottom: 16 }}>
        {cards
          // Администратору денежные показатели приходят null — карточки не показываем.
          .filter((c) => isPending || c.metric !== null)
          .map(({ title, metric, money }) => (
            <StatisticCard
              key={title}
              statistic={{
                title,
                value: metric ? (money ? formatMoney(metric.value) : Number(metric.value)) : '—',
                description: metric && <Change metric={metric} />,
              }}
            />
          ))}
      </StatisticCard.Group>
    </>
  );
}

function RevenueChart({ period, groupBy }: { period: Period; groupBy: GroupBy }) {
  const theme = useChartTheme();
  const { data, error, isPending, refetch } = useQuery(revenueQueryOptions(period, groupBy));
  const points = (data?.points ?? []).map((p) => ({
    period: periodLabel(p.period, groupBy),
    amount: Number(p.amount),
  }));

  return (
    <ProCard
      title="Динаміка виручки"
      extra={data && <Typography.Text strong>{formatMoney(data.total)}</Typography.Text>}
      loading={isPending}
      variant="outlined"
    >
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      {points.some((p) => p.amount > 0) ? (
        <Line
          height={280}
          theme={theme}
          data={points}
          xField="period"
          yField="amount"
          point={{ shapeField: 'circle', sizeField: 3 }}
          axis={{ y: { labelFormatter: (v: number) => `${v / 1000}k` } }}
          tooltip={{ items: [{ channel: 'y', valueFormatter: (v: number) => formatMoney(v) }] }}
        />
      ) : (
        <Empty description="Немає виручки за період" />
      )}
    </ProCard>
  );
}

function ClientsChart({ period, groupBy }: { period: Period; groupBy: GroupBy }) {
  const theme = useChartTheme();
  const { data, error, isPending, refetch } = useQuery(clientsReportQueryOptions(period, groupBy));
  const points = (data?.points ?? []).flatMap((p) => [
    { period: periodLabel(p.period, groupBy), kind: 'Нові', count: p.new },
    { period: periodLabel(p.period, groupBy), kind: 'Повторні', count: p.returning },
  ]);
  const retention = (data?.points ?? [])
    .filter((p) => p.retentionPercent !== null)
    .map((p) => ({ period: periodLabel(p.period, groupBy), retention: p.retentionPercent }));
  const avgRetention = retention.length
    ? Math.round(retention.reduce((acc, p) => acc + (p.retention ?? 0), 0) / retention.length)
    : null;

  return (
    <ProCard
      title="Динаміка клієнтів"
      extra={
        data && (
          <Space size="large">
            <span>
              Нові: <Typography.Text strong>{data.new}</Typography.Text>
            </span>
            <span>
              Повторні: <Typography.Text strong>{data.returning}</Typography.Text>
            </span>
            {avgRetention !== null && (
              <span>
                Утримання (сер.): <Typography.Text strong>{avgRetention}%</Typography.Text>
              </span>
            )}
          </Space>
        )
      }
      tooltip="Нові — перший завершений візит у салоні припав на період. Утримання — частка клієнтів попереднього періоду, які прийшли знову."
      loading={isPending}
      variant="outlined"
    >
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      {points.some((p) => p.count > 0) ? (
        <Column
          height={280}
          theme={theme}
          data={points}
          xField="period"
          yField="count"
          colorField="kind"
          stack
          legend={{ color: { position: 'top' } }}
        />
      ) : (
        <Empty description="Немає клієнтів за період" />
      )}
    </ProCard>
  );
}

type StaffRow = Schema<'StaffRowOut'>;

function StaffTable({ period }: { period: Period }) {
  const { can } = useViewer();
  const { data, error, isPending, refetch } = useQuery(staffReportQueryOptions(period));
  // Бекенд сортирует по выручке; администратору её не видно — сортируем по числу записей.
  const rows = can.reports.viewMoney
    ? (data ?? [])
    : [...(data ?? [])].sort((a, b) => b.records - a.records);

  return (
    <ProCard title="Ефективність співробітників" loading={isPending} variant="outlined">
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <Table<StaffRow>
        size="small"
        rowKey="masterId"
        pagination={false}
        scroll={{ x: 'max-content' }}
        dataSource={rows}
        locale={{ emptyText: 'Немає записів за період' }}
        columns={[
          { title: 'Майстер', dataIndex: 'name' },
          { title: 'Записи', dataIndex: 'records', align: 'right' },
          { title: 'Завершено', dataIndex: 'completed', align: 'right' },
          { title: 'Не прийшли', dataIndex: 'noShow', align: 'right' },
          { title: 'Скасовано', dataIndex: 'cancelled', align: 'right' },
          ...(can.reports.viewMoney
            ? [
                {
                  title: 'Виручка',
                  key: 'revenue',
                  align: 'right' as const,
                  render: (_: unknown, r: StaffRow) => formatMoney(r.revenue),
                },
                {
                  title: 'Середній чек',
                  key: 'avgCheck',
                  align: 'right' as const,
                  render: (_: unknown, r: StaffRow) => formatMoney(r.avgCheck),
                },
              ]
            : []),
          {
            title: 'Рейтинг',
            key: 'rating',
            align: 'right',
            render: (_, r) => (r.rating === null ? '—' : `${r.rating.toFixed(1)} ★ (${r.reviews})`),
          },
        ]}
      />
    </ProCard>
  );
}

type ServiceRow = Schema<'ServiceRowOut'>;

function ServicesBlock({ period }: { period: Period }) {
  const theme = useChartTheme();
  const { can } = useViewer();
  const { data, error, isPending, refetch } = useQuery(servicesReportQueryOptions(period));
  const services = [...(data?.services ?? [])].sort((a, b) => b.count - a.count);
  const categories = (data?.categories ?? [])
    .filter((c) => c.count > 0)
    .map((c) => ({ category: serviceCategoryLabel(c.category), count: c.count }));

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={16}>
        <ProCard title="Популярність послуг" loading={isPending} variant="outlined">
          <QueryErrorAlert error={error} onRetry={() => void refetch()} />
          <Table<ServiceRow>
            size="small"
            rowKey="serviceId"
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            dataSource={services}
            locale={{ emptyText: 'Немає завершених записів за період' }}
            columns={[
              { title: 'Послуга', dataIndex: 'name' },
              {
                title: 'Категорія',
                key: 'category',
                render: (_, s) => serviceCategoryLabel(s.category),
              },
              { title: 'Виконано', dataIndex: 'count', align: 'right' },
              ...(can.reports.viewMoney
                ? [
                    {
                      title: 'Виручка',
                      key: 'revenue',
                      align: 'right' as const,
                      render: (_: unknown, s: ServiceRow) => formatMoney(s.revenue),
                    },
                  ]
                : []),
            ]}
          />
        </ProCard>
      </Col>
      <Col xs={24} xl={8}>
        <ProCard title="За категоріями" loading={isPending} variant="outlined">
          {categories.length ? (
            <Pie
              height={300}
              theme={theme}
              data={categories}
              angleField="count"
              colorField="category"
              innerRadius={0.6}
              legend={{ color: { position: 'bottom', layout: { justifyContent: 'center' } } }}
            />
          ) : (
            <Empty description="Немає даних" />
          )}
        </ProCard>
      </Col>
    </Row>
  );
}
