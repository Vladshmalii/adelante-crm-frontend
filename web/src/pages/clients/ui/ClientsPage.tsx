import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer, type ProColumns, ProTable } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { App, Button, Dropdown, Popconfirm, Select, Space, Tag, Typography } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { useViewer } from '@/shared/auth';
import { formatDateTime, formatMoney, formatPhone } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import { useDeleteClient } from '../api/clients.mutations';
import { clientsListQueryOptions } from '../api/clients.queries';
import { categoryLabels, clientFullName, segmentLabels } from '../model/labels';
import { CLIENT_SORTS, type ClientSort, type ClientsSearch, toListParams } from '../model/search';
import { ClientDrawer } from './ClientDrawer';
import { ClientExportModal } from './ClientExportModal';
import { ClientFormModal } from './ClientFormModal';
import { ClientImportModal } from './ClientImportModal';

type Client = Schema<'ClientOut'>;

const route = getRouteApi('/_app/clients');

const SEGMENT_TABS = [
  { key: 'all', label: 'Усі' },
  { key: 'new', label: 'Нові' },
  { key: 'repeat', label: 'Повторні' },
  { key: 'lost', label: 'Втрачені' },
];

const isSort = (key: unknown): key is ClientSort =>
  CLIENT_SORTS.includes(key as ClientSort) && key !== 'name';

export function ClientsPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const { message } = App.useApp();
  const { can } = useViewer();
  const { data, error, isFetching, refetch } = useQuery(
    clientsListQueryOptions(toListParams(search)),
  );
  const remove = useDeleteClient();

  /** Клиент в форме: `null` — форма закрыта, `undefined` внутри — создание. */
  const [form, setForm] = useState<{ client?: Client } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const setSearch = (patch: Partial<ClientsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  // Сортировку делает бекенд: имя — по возрастанию, остальное — по убыванию.
  const sortOrder = (key: ClientSort) => (search.sort === key ? 'descend' : null);

  const columns: ProColumns<Client>[] = [
    {
      title: 'Клієнт',
      key: 'name',
      render: (_, c) => (
        <Typography.Link onClick={() => void setSearch({ id: c.id })}>
          {clientFullName(c)}
        </Typography.Link>
      ),
    },
    {
      title: 'Сегмент',
      dataIndex: 'segment',
      render: (_, c) => {
        const label = segmentLabels[c.segment];
        return label ? <Tag color={label.color}>{label.text}</Tag> : c.segment;
      },
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      render: (_, c) => <Typography.Text copyable>{formatPhone(c.phone)}</Typography.Text>,
    },
    { title: 'Email', dataIndex: 'email', ellipsis: true },
    {
      title: 'Категорія',
      dataIndex: 'category',
      render: (_, c) => (
        <Tag color={categoryLabels[c.category].color}>{categoryLabels[c.category].text}</Tag>
      ),
    },
    {
      title: 'Візитів',
      key: 'totalVisits',
      dataIndex: 'totalVisits',
      align: 'right',
      sorter: true,
      sortDirections: ['descend'],
      sortOrder: sortOrder('totalVisits'),
    },
    {
      title: 'Витрачено',
      key: 'totalSpent',
      align: 'right',
      sorter: true,
      sortDirections: ['descend'],
      sortOrder: sortOrder('totalSpent'),
      render: (_, c) => formatMoney(c.totalSpent),
    },
    {
      title: 'Знижка',
      dataIndex: 'discountPercent',
      align: 'right',
      render: (_, c) => (c.discountPercent ? `${c.discountPercent}%` : '—'),
    },
    {
      title: 'Останній візит',
      key: 'lastVisit',
      sorter: true,
      sortDirections: ['descend'],
      sortOrder: sortOrder('lastVisit'),
      render: (_, c) => formatDateTime(c.lastVisit),
    },
    { title: 'Перший візит', key: 'firstVisit', render: (_, c) => formatDateTime(c.firstVisit) },
  ];

  if (can.clients.edit || can.clients.delete) {
    columns.push({
      title: '',
      key: 'actions',
      width: 96,
      render: (_, c) => (
        <Space>
          {can.clients.edit && (
            <Button
              type="text"
              aria-label="Редагувати"
              icon={<EditOutlined />}
              onClick={() => {
                setForm({ client: c });
              }}
            />
          )}
          {can.clients.delete && (
            <Popconfirm
              title="Видалити клієнта?"
              description="Цю дію неможливо скасувати."
              okText="Видалити"
              cancelText="Скасувати"
              okButtonProps={{ danger: true }}
              onConfirm={() =>
                remove.mutateAsync(c.id).then(
                  () => message.success('Клієнта видалено'),
                  (e: unknown) => message.error(errorMessage(e)),
                )
              }
            >
              <Button type="text" danger aria-label="Видалити" icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    });
  }

  const excelMenu = [
    can.clients.import && { key: 'import', label: 'Імпорт з Excel' },
    can.clients.export && { key: 'export', label: 'Експорт в Excel' },
  ].filter((item) => !!item);

  return (
    <PageContainer title="Клієнти">
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <ProTable<Client>
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
          const { columnKey, order } = sorter as SorterResult<Client>;
          void setSearch({ sort: order && isSort(columnKey) ? columnKey : 'name', page: 1 });
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
          menu: {
            type: 'tab',
            activeKey: search.segment ?? 'all',
            items: SEGMENT_TABS,
            onChange: (key) =>
              void setSearch({
                segment: key === 'all' ? undefined : (key as ClientsSearch['segment']),
                page: 1,
              }),
          },
          search: {
            placeholder: "Ім'я, телефон, email",
            allowClear: true,
            defaultValue: search.query,
            onSearch: (query: string) => void setSearch({ query: query || undefined, page: 1 }),
          },
          actions: [
            <Select
              key="category"
              allowClear
              placeholder="Усі категорії"
              style={{ width: 160 }}
              value={search.category}
              onChange={(category?: ClientsSearch['category']) =>
                void setSearch({ category, page: 1 })
              }
              options={Object.entries(categoryLabels).map(([value, { text }]) => ({
                value,
                label: text,
              }))}
            />,
            excelMenu.length > 0 && (
              <Dropdown
                key="excel"
                trigger={['click']}
                menu={{
                  items: excelMenu,
                  onClick: ({ key }) => {
                    if (key === 'import') setImportOpen(true);
                    else setExportOpen(true);
                  },
                }}
              >
                <Button>Excel</Button>
              </Dropdown>
            ),
            can.clients.create && (
              <Button
                key="create"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setForm({});
                }}
              >
                Додати клієнта
              </Button>
            ),
          ],
        }}
      />

      <ClientDrawer
        clientId={search.id}
        onClose={() => void setSearch({ id: undefined })}
        onEdit={(client) => {
          setForm({ client });
        }}
      />
      <ClientFormModal
        open={form !== null}
        client={form?.client}
        onOpenChange={(open) => {
          if (!open) setForm(null);
        }}
      />
      <ClientImportModal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
        }}
      />
      <ClientExportModal open={exportOpen} onOpenChange={setExportOpen} />
    </PageContainer>
  );
}
