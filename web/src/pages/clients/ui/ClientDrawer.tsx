import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { ProList } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Image,
  Popconfirm,
  Result,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { useViewer } from '@/shared/auth';
import { formatDate, formatDateTime, formatMoney, formatPhone, genderLabels } from '@/shared/lib';

import { useDeleteClient } from '../api/clients.mutations';
import {
  clientQueryOptions,
  clientVisitsQueryOptions,
  VISITS_PER_PAGE,
} from '../api/clients.queries';
import {
  categoryLabels,
  clientFullName,
  importanceLabels,
  segmentLabels,
  visitStatusLabels,
} from '../model/labels';

type Client = Schema<'ClientOut'>;
type Visit = Schema<'VisitOut'>;

interface ClientDrawerProps {
  clientId: string | undefined;
  onClose: () => void;
  onEdit: (client: Client) => void;
}

export function ClientDrawer({ clientId, onClose, onEdit }: ClientDrawerProps) {
  const { message } = App.useApp();
  const { can } = useViewer();
  const remove = useDeleteClient();
  const {
    data: client,
    isPending,
    isError,
    error,
  } = useQuery({
    ...clientQueryOptions(clientId ?? ''),
    enabled: !!clientId,
  });

  const actions = client && (
    <Space>
      {can.clients.edit && (
        <Button
          icon={<EditOutlined />}
          onClick={() => {
            onEdit(client);
          }}
        >
          Редагувати
        </Button>
      )}
      {can.clients.delete && (
        <Popconfirm
          title="Видалити клієнта?"
          description="Цю дію неможливо скасувати."
          okText="Видалити"
          cancelText="Скасувати"
          okButtonProps={{ danger: true }}
          onConfirm={async () => {
            try {
              await remove.mutateAsync(client.id);
              message.success('Клієнта видалено');
              onClose();
            } catch (e) {
              message.error(errorMessage(e));
            }
          }}
        >
          <Button danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )}
    </Space>
  );

  return (
    <Drawer
      open={!!clientId}
      onClose={onClose}
      size="large"
      title={client ? clientFullName(client) : 'Клієнт'}
      extra={actions}
      destroyOnHidden
    >
      {isError ? (
        <Result status="error" title="Не вдалося завантажити клієнта" subTitle={error.message} />
      ) : isPending ? (
        <Spin />
      ) : (
        <Tabs
          items={[
            { key: 'info', label: 'Інформація', children: <ClientInfo client={client} /> },
            {
              key: 'visits',
              label: 'Історія відвідувань',
              children: <ClientVisits id={client.id} />,
            },
          ]}
        />
      )}
    </Drawer>
  );
}

function ClientInfo({ client }: { client: Client }) {
  const segment = segmentLabels[client.segment];
  return (
    <Descriptions
      column={1}
      bordered
      size="small"
      items={[
        {
          label: 'Сегмент',
          children: segment ? <Tag color={segment.color}>{segment.text}</Tag> : client.segment,
        },
        {
          label: 'Категорія',
          children: (
            <Tag color={categoryLabels[client.category].color}>
              {categoryLabels[client.category].text}
            </Tag>
          ),
        },
        {
          label: 'Телефон',
          children: <Typography.Text copyable>{formatPhone(client.phone)}</Typography.Text>,
        },
        { label: 'Додатковий телефон', children: formatPhone(client.additionalPhone) || '—' },
        { label: 'Email', children: client.email ?? '—' },
        {
          label: 'Telegram',
          children: client.telegramLinked ? (
            <Tag color="green">Підключено — отримує нагадування</Tag>
          ) : (
            <Typography.Text type="secondary">Не підключено</Typography.Text>
          ),
        },
        { label: 'Дата народження', children: formatDate(client.birthDate) },
        { label: 'Стать', children: client.gender ? genderLabels[client.gender] : '—' },
        { label: 'Важливість', children: importanceLabels[client.importance] },
        { label: 'Знижка', children: `${client.discountPercent}%` },
        { label: 'Номер картки', children: client.cardNumber ?? '—' },
        { label: 'Звідки дізнався', children: client.source ?? '—' },
        { label: 'Візитів', children: client.totalVisits },
        { label: 'Витрачено', children: formatMoney(client.totalSpent) },
        { label: 'Перший візит', children: formatDateTime(client.firstVisit) },
        { label: 'Останній візит', children: formatDateTime(client.lastVisit) },
        {
          label: 'Онлайн-запис',
          children: client.noOnlineBooking ? <Tag color="red">Заборонено</Tag> : 'Дозволено',
        },
        { label: 'Нотатки', children: client.notes ?? '—' },
      ]}
    />
  );
}

function ClientVisits({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const { data, isPending } = useQuery(clientVisitsQueryOptions(id, page));
  const total = data?.meta?.total ?? 0;

  return (
    <ProList<Visit>
      rowKey="id"
      loading={isPending}
      dataSource={data?.data}
      locale={{ emptyText: <Empty description="Візитів ще не було" /> }}
      pagination={
        total > VISITS_PER_PAGE
          ? { current: page, pageSize: VISITS_PER_PAGE, total, onChange: setPage }
          : false
      }
      columns={[
        {
          key: 'title',
          listSlot: 'title',
          render: (_, visit) => visit.services.map((s) => s.name).join(', '),
        },
        {
          key: 'description',
          listSlot: 'description',
          render: (_, visit) =>
            `${formatDateTime(visit.startAt)} · ${visit.masterName ?? 'Без майстра'}`,
        },
        {
          key: 'actions',
          listSlot: 'actions',
          render: (_, visit) => [
            <Tag key="status" color={visitStatusLabels[visit.status].color}>
              {visitStatusLabels[visit.status].text}
            </Tag>,
            <span key="amount">{formatMoney(visit.totalAmount)}</span>,
          ],
        },
        {
          key: 'content',
          listSlot: 'content',
          render: (_, visit) => <VisitDetails visit={visit} />,
        },
      ]}
    />
  );
}

function VisitDetails({ visit }: { visit: Visit }) {
  if (!visit.internalNotes && visit.photos.length === 0) return null;
  return (
    <Space orientation="vertical">
      {visit.internalNotes && (
        <Typography.Text type="secondary">«{visit.internalNotes}»</Typography.Text>
      )}
      {visit.photos.length > 0 && (
        <Image.PreviewGroup>
          <Space wrap>
            {visit.photos.map((src) => (
              <Image key={src} src={src} width={72} height={72} style={{ objectFit: 'cover' }} />
            ))}
          </Space>
        </Image.PreviewGroup>
      )}
    </Space>
  );
}
