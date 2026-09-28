import {
  AppstoreOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  HistoryOutlined,
  MoreOutlined,
  PlusOutlined,
  SwapOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  type ProColumns,
  ProTable,
  StatisticCard,
} from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { App, Button, Checkbox, Dropdown, Select, Space, Tag, Typography } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { formatMoney, formatQuantity } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import { useDeleteProduct, useRestoreProduct } from '../api/inventory.mutations';
import {
  inventoryCategoriesQueryOptions,
  inventorySummaryQueryOptions,
  productsQueryOptions,
} from '../api/inventory.queries';
import { packageBreakdown, stockStatusLabels } from '../model/labels';
import type { InventorySearch } from '../model/search';
import { CategoriesModal } from './CategoriesModal';
import { InventoryExportModal } from './InventoryExportModal';
import { InventoryImportModal } from './InventoryImportModal';
import { MovementFormModal } from './MovementFormModal';
import { MovementsDrawer } from './MovementsDrawer';
import { ProductFormModal } from './ProductFormModal';

type Product = Schema<'ProductOut'>;
type Sort = NonNullable<InventorySearch['sort']>;

const route = getRouteApi('/_app/inventory');

const SORTS: Sort[] = ['name', 'sku', 'quantity', 'createdAt'];
const isSort = (key: unknown): key is Sort => SORTS.includes(key as Sort);

/** Доля от общего числа позиций — для KPI «Закінчуються» и «Немає». */
const share = (part: number, total: number) =>
  total ? `${Math.round((part / total) * 100)}%` : undefined;

export function InventoryPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const { message, modal } = App.useApp();
  const { data, error, isFetching, refetch } = useQuery(productsQueryOptions(search));
  const { data: summary, isPending: summaryLoading } = useQuery(inventorySummaryQueryOptions());
  const { data: categories = [] } = useQuery(inventoryCategoriesQueryOptions());
  const remove = useDeleteProduct();
  const restore = useRestoreProduct();

  const [form, setForm] = useState<{ product?: Product } | null>(null);
  const [moving, setMoving] = useState<Product>();
  const [history, setHistory] = useState<Product>();
  const [dialog, setDialog] = useState<'categories' | 'import' | 'export' | null>(null);

  const setSearch = (patch: Partial<InventorySearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const sortOrder = (key: Sort) =>
    search.sort === key ? (search.desc ? 'descend' : 'ascend') : null;

  const confirmDelete = (p: Product) => {
    modal.confirm({
      title: `Видалити товар «${p.name}»?`,
      content: 'Товар зникне зі списку й вибору при списанні. Історія руху залишиться.',
      okText: 'Видалити',
      okButtonProps: { danger: true },
      cancelText: 'Скасувати',
      onOk: () =>
        remove.mutateAsync(p.id).then(
          () => void message.success('Товар видалено'),
          (e: unknown) => void message.error(errorMessage(e)),
        ),
    });
  };

  const columns: ProColumns<Product>[] = [
    {
      title: 'Назва / Артикул',
      key: 'name',
      sorter: true,
      sortOrder: sortOrder('name'),
      render: (_, p) => (
        <Space orientation="vertical" size={0}>
          <Typography.Link
            onClick={() => {
              setForm({ product: p });
            }}
          >
            {p.name}
          </Typography.Link>
          <Typography.Text type="secondary">{p.sku}</Typography.Text>
        </Space>
      ),
    },
    { title: 'Категорія', key: 'category', render: (_, p) => p.category?.name ?? '—' },
    {
      title: 'Залишок',
      key: 'quantity',
      align: 'right',
      sorter: true,
      sortOrder: sortOrder('quantity'),
      render: (_, p) => {
        const packs = packageBreakdown(p.quantity, p.unit, p.packageVolume);
        return (
          <Space orientation="vertical" size={0} style={{ alignItems: 'flex-end' }}>
            {packs ?? formatQuantity(p.quantity, p.unit)}
            {packs && (
              <Typography.Text type="secondary">
                {formatQuantity(p.quantity, p.unit)}
              </Typography.Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, p) =>
        p.isActive ? (
          <Tag color={stockStatusLabels[p.stockStatus].color}>
            {stockStatusLabels[p.stockStatus].text}
          </Tag>
        ) : (
          <Tag>Видалено</Tag>
        ),
    },
    {
      title: 'Собівартість',
      key: 'costPrice',
      align: 'right',
      render: (_, p) => formatMoney(p.costPrice),
    },
    {
      title: 'Ціна продажу',
      key: 'salePrice',
      align: 'right',
      render: (_, p) => formatMoney(p.salePrice),
    },
    {
      title: '',
      key: 'actions',
      width: 96,
      render: (_, p) =>
        !p.isActive ? (
          <Button
            type="link"
            size="small"
            loading={restore.isPending && restore.variables === p.id}
            onClick={() =>
              void restore.mutateAsync(p.id).then(
                () => void message.success('Товар відновлено'),
                (e: unknown) => void message.error(errorMessage(e)),
              )
            }
          >
            Відновити
          </Button>
        ) : (
          <Space size={0}>
            <Button
              type="text"
              aria-label="Рух товару"
              title="Рух товару"
              icon={<SwapOutlined />}
              onClick={() => {
                setMoving(p);
              }}
            />
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  { key: 'history', icon: <HistoryOutlined />, label: 'Історія руху' },
                  { key: 'edit', icon: <EditOutlined />, label: 'Редагувати' },
                  { type: 'divider' },
                  { key: 'delete', icon: <DeleteOutlined />, label: 'Видалити', danger: true },
                ],
                onClick: ({ key }) => {
                  if (key === 'history') setHistory(p);
                  if (key === 'edit') setForm({ product: p });
                  if (key === 'delete') confirmDelete(p);
                },
              }}
            >
              <Button type="text" aria-label="Дії" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        ),
    },
  ];

  const total = summary?.total ?? 0;

  return (
    <PageContainer title="Склад">
      <StatisticCard.Group direction="row" loading={summaryLoading} style={{ marginBottom: 16 }}>
        <StatisticCard statistic={{ title: 'Всього позицій', value: total }} />
        <StatisticCard
          statistic={{
            title: 'Закінчуються',
            value: summary?.low ?? 0,
            description: share(summary?.low ?? 0, total),
          }}
        />
        <StatisticCard
          statistic={{
            title: 'Немає в наявності',
            value: summary?.out ?? 0,
            description: share(summary?.out ?? 0, total),
          }}
        />
        <StatisticCard
          statistic={{
            title: 'Вартість складу',
            tip: 'Собівартість × залишок активних товарів',
            value: formatMoney(summary?.stockValue),
          }}
        />
      </StatisticCard.Group>

      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <ProTable<Product>
        rowKey="id"
        columns={columns}
        dataSource={data?.data}
        loading={isFetching}
        search={false}
        columnEmptyText="—"
        scroll={{ x: 'max-content' }}
        options={{ reload: () => void refetch(), density: true, setting: true }}
        onChange={(_, __, sorter, { action }) => {
          if (action !== 'sort') return;
          const { columnKey, order } = sorter as SorterResult<Product>;
          void setSearch({
            sort: order && isSort(columnKey) ? columnKey : undefined,
            desc: order === 'descend' ? true : undefined,
            page: 1,
          });
        }}
        pagination={{
          current: search.page,
          pageSize: search.perPage,
          total: data?.meta?.total,
          pageSizeOptions: [25, 50, 100],
          showSizeChanger: true,
          onChange: (page, perPage) => void setSearch({ page, perPage }),
        }}
        toolbar={{
          search: {
            placeholder: 'Назва або артикул',
            allowClear: true,
            defaultValue: search.query,
            onSearch: (query: string) => void setSearch({ query: query || undefined, page: 1 }),
          },
          actions: [
            <Select
              key="category"
              allowClear
              placeholder="Усі категорії"
              style={{ width: 190 }}
              value={search.categoryId}
              onChange={(categoryId?: string) => void setSearch({ categoryId, page: 1 })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />,
            <Select
              key="status"
              allowClear
              placeholder="Будь-яка наявність"
              style={{ width: 180 }}
              value={search.stockStatus}
              onChange={(stockStatus?: InventorySearch['stockStatus']) =>
                void setSearch({ stockStatus, page: 1 })
              }
              options={Object.entries(stockStatusLabels).map(([value, { text }]) => ({
                value,
                label: text,
              }))}
            />,
            <Checkbox
              key="inactive"
              checked={search.includeInactive ?? false}
              onChange={(e) =>
                void setSearch({ includeInactive: e.target.checked || undefined, page: 1 })
              }
            >
              Показати видалені
            </Checkbox>,
            <Button
              key="categories"
              icon={<AppstoreOutlined />}
              onClick={() => {
                setDialog('categories');
              }}
            >
              Категорії
            </Button>,
            <Dropdown
              key="excel"
              menu={{
                items: [
                  { key: 'import', icon: <UploadOutlined />, label: 'Імпорт з Excel' },
                  { key: 'export', icon: <DownloadOutlined />, label: 'Експорт в Excel' },
                ],
                onClick: ({ key }) => {
                  setDialog(key as 'import' | 'export');
                },
              }}
            >
              <Button>Excel</Button>
            </Dropdown>,
            <Button
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setForm({});
              }}
            >
              Додати товар
            </Button>,
          ],
        }}
      />

      <ProductFormModal
        open={form !== null}
        product={form?.product}
        onOpenChange={(open) => {
          if (!open) setForm(null);
        }}
      />
      <MovementFormModal
        product={moving}
        onClose={() => {
          setMoving(undefined);
        }}
      />
      <MovementsDrawer
        product={history}
        onClose={() => {
          setHistory(undefined);
        }}
      />
      <CategoriesModal
        open={dialog === 'categories'}
        onClose={() => {
          setDialog(null);
        }}
      />
      <InventoryImportModal
        open={dialog === 'import'}
        onClose={() => {
          setDialog(null);
        }}
      />
      <InventoryExportModal
        open={dialog === 'export'}
        categoryId={search.categoryId}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      />
    </PageContainer>
  );
}
