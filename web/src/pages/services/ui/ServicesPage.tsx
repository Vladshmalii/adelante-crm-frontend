import { AppstoreOutlined, EditOutlined, InboxOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer, type ProColumns, ProTable } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { App, Badge, Button, InputNumber, Popconfirm, Select, Space, Tag, Typography } from 'antd';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { useViewer } from '@/shared/auth';
import { formatMoney } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import { useArchiveService } from '../api/services.mutations';
import { serviceCategoriesQueryOptions, servicesListQueryOptions } from '../api/services.queries';
import { groupByCategory } from '../model/group';
import { statusLabels } from '../model/labels';
import type { ServicesSearch } from '../model/search';
import { CategoriesModal } from './CategoriesModal';
import { ServiceFormModal } from './ServiceFormModal';

type Service = Schema<'app__api__admin__services__ServiceOut'>;
/** Строка-заголовок категории; услуги — её дочерние строки. */
interface GroupRow {
  id: string;
  name: string;
  children: Service[];
}
type Row = Service | GroupRow;

const isGroup = (row: Row): row is GroupRow => 'children' in row;
const groupKey = (categoryId: string) => `category:${categoryId}`;

const route = getRouteApi('/_app/services');

export function ServicesPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const { message } = App.useApp();
  const { can } = useViewer();
  const { data, error, isFetching, refetch } = useQuery(servicesListQueryOptions(search));
  const { data: categories = [] } = useQuery(serviceCategoriesQueryOptions());
  const archive = useArchiveService();
  const [form, setForm] = useState<{ service?: Service } | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  const rows: GroupRow[] = groupByCategory(data ?? [], categories).map((g) => ({
    id: groupKey(g.id),
    name: g.name,
    children: g.items,
  }));

  const setSearch = (patch: Partial<ServicesSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const columns: ProColumns<Row>[] = [
    {
      title: 'Послуга',
      key: 'name',
      render: (_, s) =>
        isGroup(s) ? (
          <Space>
            <Typography.Text strong>{s.name}</Typography.Text>
            <Typography.Text type="secondary">{s.children.length}</Typography.Text>
          </Space>
        ) : (
          <Space>
            <Badge color={s.color ?? '#d9d9d9'} />
            {can.services.manage ? (
              <Typography.Link
                onClick={() => {
                  setForm({ service: s });
                }}
              >
                {s.name}
              </Typography.Link>
            ) : (
              s.name
            )}
          </Space>
        ),
    },
    {
      title: 'Тривалість',
      key: 'duration',
      align: 'right',
      render: (_, s) => (isGroup(s) ? null : `${s.durationMinutes} хв`),
    },
    {
      title: 'Ціна',
      key: 'price',
      align: 'right',
      render: (_, s) => (isGroup(s) ? null : formatMoney(s.price)),
    },
    {
      title: 'Майстри',
      key: 'masters',
      render: (_, s) =>
        isGroup(s) ? null : s.masters?.length ? (
          <Space size={[0, 4]} wrap>
            {s.masters.map((m) => (
              <Tag key={m.id}>{m.name}</Tag>
            ))}
          </Space>
        ) : (
          <Typography.Text type="secondary">Не призначено</Typography.Text>
        ),
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, s) =>
        isGroup(s) ? null : (
          <Tag color={statusLabels[s.status].color}>{statusLabels[s.status].text}</Tag>
        ),
    },
    {
      title: 'Опис',
      key: 'description',
      ellipsis: true,
      render: (_, s) => (isGroup(s) ? null : s.description),
    },
  ];

  if (can.services.manage) {
    columns.push({
      title: '',
      key: 'actions',
      width: 96,
      render: (_, s) =>
        isGroup(s) ? null : (
          <Space>
            <Button
              type="text"
              aria-label="Редагувати"
              icon={<EditOutlined />}
              onClick={() => {
                setForm({ service: s });
              }}
            />
            {s.status !== 'archived' && (
              <Popconfirm
                title="Архівувати послугу?"
                description="Вона зникне з вибору при записі. Повернути можна, змінивши статус."
                okText="Архівувати"
                cancelText="Скасувати"
                onConfirm={() =>
                  archive.mutateAsync(s.id).then(
                    () => message.success('Послугу архівовано'),
                    (e: unknown) => message.error(errorMessage(e)),
                  )
                }
              >
                <Button type="text" aria-label="Архівувати" icon={<InboxOutlined />} />
              </Popconfirm>
            )}
          </Space>
        ),
    });
  }

  return (
    <PageContainer title="Послуги">
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <ProTable<Row>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        expandable={{
          expandedRowKeys: rows.filter((r) => !collapsed.has(r.id)).map((r) => r.id),
          onExpand: (expanded, row) => {
            setCollapsed((prev) => {
              const next = new Set(prev);
              if (expanded) next.delete(row.id);
              else next.add(row.id);
              return next;
            });
          },
        }}
        loading={isFetching}
        search={false}
        columnEmptyText="—"
        scroll={{ x: 'max-content' }}
        pagination={false}
        options={{ reload: () => void refetch(), density: true, setting: true }}
        toolbar={{
          search: {
            placeholder: 'Назва послуги',
            allowClear: true,
            defaultValue: search.query,
            onSearch: (query: string) => void setSearch({ query: query || undefined }),
          },
          actions: [
            <Select
              key="category"
              allowClear
              placeholder="Усі категорії"
              style={{ width: 170 }}
              value={search.categoryId}
              onChange={(categoryId?: string) => void setSearch({ categoryId })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />,
            <Select
              key="status"
              allowClear
              placeholder="Усі статуси"
              style={{ width: 150 }}
              value={search.status}
              onChange={(status?: ServicesSearch['status']) => void setSearch({ status })}
              options={Object.entries(statusLabels).map(([value, { text }]) => ({
                value,
                label: text,
              }))}
            />,
            <Space.Compact key="price">
              <PriceBound
                placeholder="Ціна від"
                value={search.priceFrom}
                onCommit={(priceFrom) => void setSearch({ priceFrom })}
              />
              <PriceBound
                placeholder="до"
                value={search.priceTo}
                onCommit={(priceTo) => void setSearch({ priceTo })}
              />
            </Space.Compact>,
            can.services.manage && (
              <Button
                key="categories"
                icon={<AppstoreOutlined />}
                onClick={() => {
                  setCategoriesOpen(true);
                }}
              >
                Категорії
              </Button>
            ),
            can.services.manage && (
              <Button
                key="create"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setForm({});
                }}
              >
                Додати послугу
              </Button>
            ),
          ],
        }}
      />

      <CategoriesModal
        open={categoriesOpen}
        onClose={() => {
          setCategoriesOpen(false);
        }}
      />
      <ServiceFormModal
        open={form !== null}
        service={form?.service}
        onOpenChange={(open) => {
          if (!open) setForm(null);
        }}
      />
    </PageContainer>
  );
}

/** Граница цены: применяется по Enter или при уходе с поля, а не на каждый символ. */
function PriceBound(props: {
  value?: number;
  placeholder: string;
  onCommit: (value: number | undefined) => void;
}) {
  const commit = (raw: string) => {
    const value = raw === '' ? undefined : Number(raw);
    if (value !== props.value && (value === undefined || Number.isFinite(value)))
      props.onCommit(value);
  };
  return (
    <InputNumber<number>
      key={props.value ?? 'empty'}
      min={0}
      step={50}
      style={{ width: 110 }}
      placeholder={props.placeholder}
      defaultValue={props.value}
      onBlur={(e) => {
        commit(e.target.value.replace(/\s/g, ''));
      }}
      onPressEnter={(e) => {
        commit(e.currentTarget.value.replace(/\s/g, ''));
      }}
    />
  );
}
