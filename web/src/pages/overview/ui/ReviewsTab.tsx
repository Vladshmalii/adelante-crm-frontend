import { ProList } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { Empty, Rate, Select, Space, Typography } from 'antd';

import type { Schema } from '@/shared/api';
import { formatDateTime, toOptions } from '@/shared/lib';
import { DateRangeFilter, QueryErrorAlert } from '@/shared/ui';

import { reviewsParams, reviewsQueryOptions } from '../api/overview.queries';
import { reviewTypeLabels } from '../model/labels';
import type { OverviewSearch } from '../model/search';

type Review = Schema<'ReviewOut'>;

interface TabProps {
  search: OverviewSearch;
  setSearch: (patch: Partial<OverviewSearch>) => void;
}

export function ReviewsTab({ search, setSearch }: TabProps) {
  const { data, error, isFetching, refetch } = useQuery(reviewsQueryOptions(reviewsParams(search)));

  return (
    <>
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <ProList<Review>
        rowKey="id"
        loading={isFetching}
        dataSource={data?.data}
        locale={{ emptyText: <Empty description="Відгуків немає" /> }}
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
              placeholder="Тип відгуку"
              style={{ width: 180 }}
              value={search.reviewType}
              options={toOptions(reviewTypeLabels)}
              onChange={(reviewType?: OverviewSearch['reviewType']) => {
                setSearch({ reviewType, page: 1 });
              }}
            />
            <Select
              allowClear
              placeholder="Оцінка"
              style={{ width: 120 }}
              value={search.rating}
              options={[5, 4, 3, 2, 1].map((value) => ({ value, label: '★'.repeat(value) }))}
              onChange={(rating?: number) => {
                setSearch({ rating, page: 1 });
              }}
            />
          </Space>
        }
        pagination={{
          current: search.page,
          pageSize: search.perPage,
          total: data?.meta?.total,
          onChange: (page, perPage) => {
            setSearch({ page, perPage });
          },
        }}
        columns={[
          {
            key: 'title',
            listSlot: 'title',
            render: (_, r) => (
              <Space>
                {r.client.name ?? 'Клієнт'}
                <Rate disabled value={r.rating} style={{ fontSize: 14 }} />
              </Space>
            ),
          },
          {
            key: 'description',
            listSlot: 'description',
            render: (_, r) => `${formatDateTime(r.createdAt)} · майстер: ${r.master.name ?? '—'}`,
          },
          {
            key: 'content',
            listSlot: 'content',
            render: (_, r) =>
              r.text ? (
                <Typography.Paragraph style={{ marginBottom: 0 }}>«{r.text}»</Typography.Paragraph>
              ) : (
                <Typography.Text type="secondary">Без коментаря</Typography.Text>
              ),
          },
          {
            key: 'actions',
            listSlot: 'actions',
            render: (_, r) => [
              <Typography.Link
                key="record"
                onClick={() => {
                  setSearch({ recordId: r.recordId });
                }}
              >
                Запис
              </Typography.Link>,
            ],
          },
        ]}
      />
    </>
  );
}
