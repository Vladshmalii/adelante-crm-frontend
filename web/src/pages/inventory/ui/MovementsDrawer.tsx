import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Drawer, Table, Tag, Typography } from 'antd';
import { useState } from 'react';

import type { Schema } from '@/shared/api';
import { formatDateTime, formatQuantity } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import { movementsQueryOptions } from '../api/inventory.queries';
import { movementTypeLabels } from '../model/labels';

type Product = Schema<'ProductOut'>;
type Movement = Schema<'MovementOut'>;

interface MovementsDrawerProps {
  product: Product | undefined;
  onClose: () => void;
}

/** История движений товара: надходження, списання (в т.ч. по записям), коригування. */
export function MovementsDrawer({ product, onClose }: MovementsDrawerProps) {
  const [page, setPage] = useState(1);
  const { data, error, isFetching, refetch } = useQuery({
    ...movementsQueryOptions(product?.id ?? '', page),
    enabled: !!product,
  });

  return (
    <Drawer
      open={!!product}
      onClose={() => {
        setPage(1);
        onClose();
      }}
      size="large"
      destroyOnHidden
      title={product ? `Історія руху: ${product.name}` : 'Історія руху'}
    >
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      {product && (
        <Table<Movement>
          rowKey="id"
          size="small"
          loading={isFetching}
          dataSource={data?.data}
          locale={{ emptyText: 'Рухів ще не було' }}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.meta?.total,
            showSizeChanger: false,
            onChange: setPage,
          }}
          columns={[
            { title: 'Дата', key: 'date', render: (_, m) => formatDateTime(m.createdAt) },
            {
              title: 'Тип',
              key: 'type',
              render: (_, m) => (
                <Tag color={movementTypeLabels[m.type].color}>
                  {movementTypeLabels[m.type].text}
                </Tag>
              ),
            },
            {
              title: 'Зміна',
              key: 'delta',
              align: 'right',
              render: (_, m) => (
                <Typography.Text type={Number(m.delta) < 0 ? 'danger' : 'success'}>
                  {Number(m.delta) > 0 ? '+' : ''}
                  {formatQuantity(m.delta, product.unit)}
                </Typography.Text>
              ),
            },
            {
              title: 'Залишок',
              key: 'after',
              align: 'right',
              render: (_, m) => formatQuantity(m.quantityAfter, product.unit),
            },
            {
              title: 'Причина',
              key: 'reason',
              render: (_, m) =>
                m.recordId ? (
                  <Link to="/overview" search={{ tab: 'records', recordId: m.recordId }}>
                    {m.reason ?? 'Запис'}
                  </Link>
                ) : (
                  (m.reason ?? '—')
                ),
            },
            { title: 'Автор', key: 'author', render: (_, m) => m.author.name ?? '—' },
          ]}
        />
      )}
    </Drawer>
  );
}
