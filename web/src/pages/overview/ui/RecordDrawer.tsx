import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  Descriptions,
  Drawer,
  Empty,
  Image,
  Result,
  Space,
  Spin,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from 'antd';

import type { Schema } from '@/shared/api';
import { formatDateTime, formatMoney, formatPhone, inSalonTz } from '@/shared/lib';
import { ChangeDetails } from '@/shared/ui';

import { recordQueryOptions } from '../api/overview.queries';
import {
  auditActionLabels,
  importanceLabels,
  paymentStatusLabels,
  recordStatusLabels,
  sourceLabels,
} from '../model/labels';

type RecordItem = Schema<'RecordDetailOut'>;

interface RecordDrawerProps {
  recordId: string | undefined;
  onClose: () => void;
}

export function RecordDrawer({ recordId, onClose }: RecordDrawerProps) {
  const {
    data: record,
    isPending,
    isError,
    error,
  } = useQuery({
    ...recordQueryOptions(recordId ?? ''),
    enabled: !!recordId,
  });

  return (
    <Drawer
      open={!!recordId}
      onClose={onClose}
      size="large"
      destroyOnHidden
      title={record ? `Запис: ${record.client.name}` : 'Запис'}
      extra={
        record && (
          <Tag color={recordStatusLabels[record.status].color}>
            {recordStatusLabels[record.status].text}
          </Tag>
        )
      }
    >
      {isError ? (
        <Result status="error" title="Не вдалося завантажити запис" subTitle={error.message} />
      ) : isPending ? (
        <Spin />
      ) : (
        <Tabs
          items={[
            { key: 'details', label: 'Запис', children: <Details record={record} /> },
            { key: 'finance', label: 'Фінанси', children: <Finance record={record} /> },
            {
              key: 'history',
              label: `Історія (${record.history.length})`,
              children: <History record={record} />,
            },
            {
              key: 'media',
              label: `Медіа (${record.photos.length})`,
              children: <Media record={record} />,
            },
          ]}
        />
      )}
    </Drawer>
  );
}

const timeRange = (start: string | null, end: string | null) =>
  start ? `${formatDateTime(start)} – ${end ? inSalonTz(end).format('HH:mm') : '…'}` : '—';

function Details({ record }: { record: RecordItem }) {
  return (
    <Descriptions
      column={1}
      bordered
      size="small"
      items={[
        {
          label: 'Клієнт',
          children: (
            <Space orientation="vertical" size={0}>
              <Link to="/clients" search={{ id: record.client.id }}>
                {record.client.name}
              </Link>
              <Typography.Text copyable>{formatPhone(record.client.phone)}</Typography.Text>
            </Space>
          ),
        },
        ...(record.visitorName || record.visitorPhone
          ? [
              {
                label: 'Хто прийде',
                children: [record.visitorName, formatPhone(record.visitorPhone)]
                  .filter(Boolean)
                  .join(', '),
              },
            ]
          : []),
        {
          label: 'Майстер',
          children: record.master?.name ?? <Tag color="orange">Без майстра</Tag>,
        },
        {
          label: record.services.length > 1 ? 'Послуги' : 'Послуга',
          children: (
            <Space orientation="vertical" size={0}>
              {record.services.map((s) => (
                <span key={s.id}>
                  {s.name} · {s.durationMinutes} хв · {formatMoney(s.price)}
                </span>
              ))}
            </Space>
          ),
        },
        { label: 'Плановий час', children: timeRange(record.startAt, record.endAt) },
        {
          label: 'Фактичний час',
          children: record.actualStartAt
            ? timeRange(record.actualStartAt, record.actualEndAt)
            : 'Не розпочато',
        },
        {
          label: 'Рівень',
          children: (
            <Tag color={importanceLabels[record.importance].color}>
              {importanceLabels[record.importance].text}
            </Tag>
          ),
        },
        { label: 'Джерело', children: sourceLabels[record.source] },
        { label: 'Коментар', children: record.comment ?? '—' },
        { label: 'Нотатки майстра', children: record.internalNotes ?? '—' },
        {
          label: 'Створено',
          children: `${formatDateTime(record.createdAt)} · ${record.createdBy.name ?? '—'}`,
        },
      ]}
    />
  );
}

function Finance({ record }: { record: RecordItem }) {
  return (
    <Descriptions
      column={1}
      bordered
      size="small"
      items={[
        ...record.services.map((s) => ({ label: s.name, children: formatMoney(s.price) })),
        { label: 'Разом за послуги', children: formatMoney(record.price) },
        { label: 'До сплати', children: formatMoney(record.totalAmount) },
        {
          label: 'Оплата',
          children: (
            <Tag color={paymentStatusLabels[record.paymentStatus].color}>
              {paymentStatusLabels[record.paymentStatus].text}
            </Tag>
          ),
        },
        { label: 'Хто закрив', children: record.closedBy.name ?? '—' },
        { label: 'Коли закрили', children: formatDateTime(record.closedAt) },
      ]}
    />
  );
}

function History({ record }: { record: RecordItem }) {
  if (record.history.length === 0) return <Empty description="Змін не було" />;
  return (
    <Timeline
      items={record.history.map((h, i) => {
        const action = auditActionLabels[h.action as Schema<'AuditAction'>] as
          { text: string; color: string } | undefined;
        return {
          key: i,
          color: action?.color,
          content: (
            <>
              <Typography.Text strong>{action?.text ?? h.action}</Typography.Text>
              <Typography.Text type="secondary">
                {' '}
                · {formatDateTime(h.date)} · {h.author ?? 'Система'}
              </Typography.Text>
              <ChangeDetails details={h.details} />
            </>
          ),
        };
      })}
    />
  );
}

function Media({ record }: { record: RecordItem }) {
  if (record.photos.length === 0) return <Empty description="Фото немає" />;
  return (
    <Image.PreviewGroup>
      <Space wrap>
        {record.photos.map((photo) => (
          <Image
            key={photo.id}
            src={photo.url}
            width={120}
            height={120}
            style={{ objectFit: 'cover' }}
          />
        ))}
      </Space>
    </Image.PreviewGroup>
  );
}
