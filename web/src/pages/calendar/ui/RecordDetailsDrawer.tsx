import { DeleteOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Image,
  Popconfirm,
  Result,
  Row,
  Segmented,
  Space,
  Spin,
  Statistic,
  Tabs,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from 'antd';

import { errorMessage, type Schema } from '@/shared/api';
import { useViewer } from '@/shared/auth';
import {
  formatDateTime,
  formatMoney,
  formatPhone,
  importanceLabels,
  inSalonTz,
  paymentStatusLabels,
  recordStatusLabels,
  sourceLabels,
} from '@/shared/lib';
import { ChangeDetails } from '@/shared/ui';
import { RecordConsumables } from '@/widgets/record-consumables';

import { useSetRecordStatus } from '../api/calendar.mutations';
import { clientCardQueryOptions, recordQueryOptions } from '../api/calendar.queries';
import { reminderStatus } from '../model/reminder';
import { durationMinutes } from '../model/time';
import { ReminderBlock } from './ReminderBlock';

type RecordDetail = Schema<'RecordDetailOut'>;
type RecordItem = Schema<'RecordOut'>;
type Status = Schema<'RecordStatus'>;

/** Статусы, которые переключаются кнопками; «Завершено» — через завершение визита. */
const SWITCHABLE: Status[] = ['scheduled', 'confirmed', 'arrived', 'no_show'];

/** Короткие подписи — четыре статуса помещаются в одну строку средней колонки. */
const SHORT_STATUS: Partial<Record<Status, string>> = { arrived: 'Прийшов' };

const AUDIT_ACTIONS: Record<string, { text: string; color: string }> = {
  created: { text: 'Додавання', color: 'green' },
  updated: { text: 'Зміна', color: 'blue' },
  deleted: { text: 'Видалення', color: 'red' },
};

interface RecordDetailsDrawerProps {
  recordId: string | undefined;
  onClose: () => void;
  onEdit: (record: RecordItem) => void;
  onComplete: (record: RecordItem) => void;
  onPay: (record: RecordItem) => void;
}

/** «Деталі запису»: когда и у кого, статус, услуги и оплата, клиент — три колонки. */
export function RecordDetailsDrawer({
  recordId,
  onClose,
  onEdit,
  onComplete,
  onPay,
}: RecordDetailsDrawerProps) {
  const { message } = App.useApp();
  const { can } = useViewer();
  const setStatus = useSetRecordStatus();
  const {
    data: record,
    isPending,
    isError,
    error,
  } = useQuery({
    ...recordQueryOptions(recordId ?? ''),
    enabled: !!recordId,
  });

  const closed = record?.status === 'completed' || record?.status === 'cancelled';

  const changeStatus = (status: Status) => {
    if (!record) return;
    setStatus.mutate(
      { id: record.id, status },
      {
        onSuccess: () => void message.success(`Статус: ${recordStatusLabels[status].text}`),
        onError: (e) => void message.error(errorMessage(e)),
      },
    );
  };

  return (
    <Drawer
      open={!!recordId}
      onClose={onClose}
      size="min(1180px, 96vw)"
      destroyOnHidden
      title={record ? `Запис: ${record.client.name}` : 'Запис'}
      extra={
        record && (
          <Space>
            {record.outsideShift && <Tag color="warning">Поза зміною майстра</Tag>}
            <Tag color={recordStatusLabels[record.status].color}>
              {recordStatusLabels[record.status].text}
            </Tag>
            {!closed && (
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  onEdit(record);
                }}
              >
                Редагувати
              </Button>
            )}
            {!closed && (
              <Popconfirm
                title="Скасувати запис?"
                description="Запис зникне з розкладу, клієнт отримає сповіщення."
                okText="Скасувати запис"
                okButtonProps={{ danger: true }}
                cancelText="Назад"
                onConfirm={() => {
                  changeStatus('cancelled');
                }}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Скасувати
                </Button>
              </Popconfirm>
            )}
          </Space>
        )
      }
    >
      {isError ? (
        <Result status="error" title="Не вдалося завантажити запис" subTitle={error.message} />
      ) : isPending ? (
        <Spin />
      ) : (
        <Row gutter={24}>
          <Col span={7}>
            <When record={record} />
          </Col>
          <Col span={10}>
            <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
              <Segmented<Status>
                block
                value={SWITCHABLE.includes(record.status) ? record.status : undefined}
                disabled={closed || setStatus.isPending}
                options={SWITCHABLE.map((s) => ({
                  value: s,
                  label: SHORT_STATUS[s] ?? recordStatusLabels[s].text,
                }))}
                onChange={changeStatus}
              />
              <Services record={record} />
              <Actions
                record={record}
                canPay={can.records.pay}
                onComplete={onComplete}
                onPay={onPay}
              />
              <Tabs
                items={[
                  {
                    key: 'consumables',
                    label: 'Витрати',
                    children: (
                      <RecordConsumables
                        recordId={record.id}
                        canWriteOff={
                          can.records.writeOffConsumables && record.status !== 'cancelled'
                        }
                        canCancel={can.records.writeOffConsumables}
                      />
                    ),
                  },
                  {
                    key: 'reminder',
                    label: 'Нагадування',
                    children: <ReminderBlock record={record} editable={!closed} />,
                  },
                  {
                    key: 'history',
                    label: `Історія (${record.history.length})`,
                    children: <History record={record} />,
                  },
                  {
                    key: 'photos',
                    label: `Фото (${record.photos.length})`,
                    children: <Photos record={record} />,
                  },
                ]}
              />
            </Space>
          </Col>
          <Col span={7}>
            <Client record={record} />
          </Col>
        </Row>
      )}
    </Drawer>
  );
}

function When({ record }: { record: RecordDetail }) {
  const start = inSalonTz(record.startAt);
  return (
    <Descriptions
      column={1}
      size="small"
      items={[
        {
          label: 'Майстер',
          children: record.master ? (
            <Space>
              <Avatar size="small" style={{ background: record.master.color ?? undefined }}>
                {record.master.name.charAt(0)}
              </Avatar>
              {record.master.name}
            </Space>
          ) : (
            <Tag color="orange">Без майстра</Tag>
          ),
        },
        { label: 'Дата', children: start.format('D MMMM YYYY') },
        {
          label: 'Час',
          children: `${start.format('HH:mm')}–${inSalonTz(record.endAt).format('HH:mm')} · ${durationMinutes(record.startAt, record.endAt)} хв`,
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
        {
          label: 'Створено',
          children: `${formatDateTime(record.createdAt)}${record.createdBy.name ? `, ${record.createdBy.name}` : ''}`,
        },
        { label: 'Коментар', children: record.comment ?? '—' },
        ...(record.internalNotes ? [{ label: 'Нотатки', children: record.internalNotes }] : []),
      ]}
    />
  );
}

function Services({ record }: { record: RecordDetail }) {
  return (
    <Card size="small">
      <Space orientation="vertical" style={{ display: 'flex' }}>
        {record.services.map((s) => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span>
              {s.name} <Typography.Text type="secondary">· {s.durationMinutes} хв</Typography.Text>
            </span>
            <span>{formatMoney(s.price)}</span>
          </div>
        ))}
        <Divider style={{ margin: '4px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tag color={paymentStatusLabels[record.paymentStatus].color}>
            {paymentStatusLabels[record.paymentStatus].text}
          </Tag>
          <Typography.Text strong style={{ fontSize: 18 }}>
            {formatMoney(record.totalAmount)}
          </Typography.Text>
        </div>
      </Space>
    </Card>
  );
}

function Actions({
  record,
  canPay,
  onComplete,
  onPay,
}: {
  record: RecordDetail;
  canPay: boolean;
  onComplete: (r: RecordItem) => void;
  onPay: (r: RecordItem) => void;
}) {
  const completable = ['scheduled', 'confirmed', 'arrived'].includes(record.status);
  const payable = record.status === 'completed' && record.paymentStatus !== 'paid';
  return (
    <Space wrap>
      {completable && (
        <Tooltip title={record.master ? undefined : 'Спочатку призначте майстра'}>
          <Button
            type="primary"
            disabled={!record.master}
            onClick={() => {
              onComplete(record);
            }}
          >
            Завершити візит
          </Button>
        </Tooltip>
      )}
      {payable &&
        (canPay ? (
          <Button
            type="primary"
            onClick={() => {
              onPay(record);
            }}
          >
            Оплатити {formatMoney(record.totalAmount)}
          </Button>
        ) : (
          <Typography.Text type="secondary">Оплату проводить адміністратор</Typography.Text>
        ))}
    </Space>
  );
}

function Client({ record }: { record: RecordDetail }) {
  const { data: client } = useQuery(clientCardQueryOptions(record.client.id));
  const reminder = reminderStatus(record);
  return (
    <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
      <Space>
        <Avatar size={40} icon={<UserOutlined />} />
        <div>
          <Typography.Text strong style={{ display: 'block' }}>
            {record.client.name}
          </Typography.Text>
          <Typography.Text copyable type="secondary">
            {formatPhone(record.client.phone)}
          </Typography.Text>
        </div>
      </Space>
      <Link to="/clients" search={{ id: record.client.id }}>
        Профіль клієнта
      </Link>
      {(record.visitorName ?? record.visitorPhone) && (
        <Card size="small" title="Прийде інша людина">
          {record.visitorName ?? '—'}
          {record.visitorPhone && (
            <Typography.Text type="secondary" style={{ display: 'block' }}>
              {formatPhone(record.visitorPhone)}
            </Typography.Text>
          )}
        </Card>
      )}
      {client && (
        <>
          <Row gutter={8}>
            <Col span={12}>
              <Statistic title="Візитів" value={client.totalVisits} />
            </Col>
            <Col span={12}>
              <Statistic title="Витрачено" value={formatMoney(client.totalSpent)} />
            </Col>
          </Row>
          <Descriptions
            size="small"
            column={1}
            items={[
              { label: 'Останній візит', children: formatDateTime(client.lastVisit) },
              { label: 'Додатковий телефон', children: formatPhone(client.additionalPhone) || '—' },
              { label: 'Примітка', children: client.notes ?? '—' },
            ]}
          />
        </>
      )}
      <Typography.Text type={reminder.type}>Нагадування — {reminder.text}</Typography.Text>
    </Space>
  );
}

function History({ record }: { record: RecordDetail }) {
  if (record.history.length === 0) return <Empty description="Змін не було" />;
  return (
    <Timeline
      items={record.history.map((h, i) => {
        const action = AUDIT_ACTIONS[h.action];
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

function Photos({ record }: { record: RecordDetail }) {
  if (record.photos.length === 0) return <Empty description="Фото немає" />;
  return (
    <Image.PreviewGroup>
      <Space wrap>
        {record.photos.map((photo) => (
          <Image
            key={photo.id}
            src={photo.url}
            width={110}
            height={110}
            style={{ objectFit: 'cover' }}
          />
        ))}
      </Space>
    </Image.PreviewGroup>
  );
}
