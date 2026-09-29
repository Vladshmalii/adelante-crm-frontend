import {
  CheckCircleFilled,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarCircleFilled,
  LoginOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { theme, Tooltip, Typography } from 'antd';
import type { CSSProperties, ReactNode } from 'react';

import type { Schema } from '@/shared/api';
import { formatPhone, inSalonTz, recordStatusLabels } from '@/shared/lib';

type RecordItem = Schema<'RecordOut'>;
type Status = Schema<'RecordStatus'>;

const STATUS_ICONS: Record<Status, ReactNode> = {
  scheduled: <ClockCircleOutlined />,
  confirmed: <CheckCircleOutlined style={{ color: '#1677ff' }} />,
  arrived: <LoginOutlined style={{ color: '#13c2c2' }} />,
  completed: <CheckCircleFilled style={{ color: '#52c41a' }} />,
  cancelled: <StopOutlined style={{ color: '#ff4d4f' }} />,
  no_show: <CloseCircleOutlined style={{ color: '#fa8c16' }} />,
};

export function StatusIcon({ status }: { status: Status }) {
  return <Tooltip title={recordStatusLabels[status].text}>{STATUS_ICONS[status]}</Tooltip>;
}

/** Цвет карточки — по уровню записи: стандартний / важливий / особливий. */
function useImportanceColors(importance: Schema<'RecordImportance'>) {
  const { token } = theme.useToken();
  if (importance === 'important') return { bg: token.colorWarningBg, accent: token.colorWarning };
  if (importance === 'special') return { bg: token.magenta1, accent: token.magenta6 };
  return { bg: token.colorPrimaryBg, accent: token.colorPrimary };
}

const timeRange = (r: RecordItem) =>
  `${inSalonTz(r.startAt).format('HH:mm')}–${inSalonTz(r.endAt).format('HH:mm')}`;

const serviceNames = (r: RecordItem) => r.services.map((s) => s.name).join(', ');

interface RecordCardProps {
  record: RecordItem;
  /** Сколько строк помещается: на коротких карточках — только время и услуга. */
  size?: 'small' | 'medium' | 'large';
  style?: CSSProperties;
  onClick?: () => void;
}

/** Карточка записи в сетке: время, статус, услуги, клиент, телефон, комментарий. */
export function RecordCard({ record, size = 'large', style, onClick }: RecordCardProps) {
  const { token } = theme.useToken();
  const colors = useImportanceColors(record.importance);
  const guest = record.visitorName;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${timeRange(record)} ${serviceNames(record)} ${record.client.name}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick?.();
      }}
      style={{
        background: colors.bg,
        borderLeft: `3px solid ${record.master?.color ?? colors.accent}`,
        borderRadius: token.borderRadiusSM,
        padding: '2px 6px',
        overflow: 'hidden',
        cursor: 'pointer',
        fontSize: token.fontSizeSM,
        lineHeight: 1.35,
        boxShadow: token.boxShadowTertiary,
        opacity: record.status === 'no_show' ? 0.6 : 1,
        ...style,
      }}
    >
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <Typography.Text strong style={{ fontSize: 'inherit' }}>
          {timeRange(record)}
        </Typography.Text>
        <StatusIcon status={record.status} />
        {record.paymentStatus === 'paid' && (
          <Tooltip title="Оплачено">
            <DollarCircleFilled style={{ color: token.colorSuccess }} />
          </Tooltip>
        )}
      </div>
      <div
        style={{
          fontWeight: 500,
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
        }}
      >
        {serviceNames(record)}
      </div>
      {size !== 'small' && (
        <div style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
          {guest ? `${guest} (Гість)` : record.client.name}
        </div>
      )}
      {size === 'large' && (
        <Typography.Text type="secondary" style={{ fontSize: 'inherit', display: 'block' }}>
          {formatPhone(record.visitorPhone ?? record.client.phone)}
        </Typography.Text>
      )}
      {size === 'large' && record.comment && (
        <Typography.Text
          type="secondary"
          italic
          style={{ fontSize: 'inherit', display: 'block' }}
          ellipsis
        >
          {record.comment}
        </Typography.Text>
      )}
    </div>
  );
}
