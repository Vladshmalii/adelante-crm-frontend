import {
  CalendarOutlined,
  ClockCircleOutlined,
  ScissorOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Alert, Button, Typography } from 'antd';
import type { ReactNode } from 'react';

import type { Schema } from '@/shared/api';
import { formatMoney, formatPhone } from '@/shared/lib';
import { lightPalette, withAlpha } from '@/shared/theme';

import { formatDuration, visitDate, visitTime } from '../model/booking';
import { StepTitle } from './BookingShell';
import type { ClientDetails } from './DetailsStep';

type Service = Schema<'app__api__booking__router__ServiceOut'>;

interface ConfirmStepProps {
  service: Service;
  masterName: string;
  slot: string;
  details: ClientDetails;
  loading: boolean;
  onConfirm: () => void;
}

export function SummaryRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0' }}>
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // bg-primary/20, иконка text-primary
          background: withAlpha(lightPalette.primary, 0.2),
          color: lightPalette.primaryText,
        }}
      >
        {icon}
      </span>
      <div>
        <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
          {label}
        </Typography.Text>
        <div style={{ fontWeight: 500 }}>{children}</div>
      </div>
    </div>
  );
}

/** Шаг 5: проверить и подтвердить. Цена — по услуге; бекенд вернёт итог в ответе. */
export function ConfirmStep({
  service,
  masterName,
  slot,
  details,
  loading,
  onConfirm,
}: ConfirmStepProps) {
  return (
    <>
      <StepTitle title="Підтвердження запису" subtitle="Перевірте деталі вашого запису" />
      <SummaryRow icon={<ScissorOutlined />} label="Послуга">
        {service.name} · {formatDuration(service.duration_minutes)} · {formatMoney(service.price)}
      </SummaryRow>
      <SummaryRow icon={<UserOutlined />} label="Майстер">
        {masterName}
      </SummaryRow>
      <SummaryRow icon={<CalendarOutlined />} label="Дата">
        <span style={{ textTransform: 'capitalize' }}>{visitDate(slot)}</span>
      </SummaryRow>
      <SummaryRow icon={<ClockCircleOutlined />} label="Час">
        {visitTime(slot)}
      </SummaryRow>
      <div
        style={{
          background: withAlpha(lightPalette.muted, 0.6),
          borderRadius: 14,
          padding: '12px 16px',
          margin: '12px 0 16px',
        }}
      >
        <Typography.Text strong style={{ display: 'block' }}>
          Ваші дані
        </Typography.Text>
        <Typography.Text style={{ display: 'block' }}>
          {details.name}, {formatPhone(details.phone)}
        </Typography.Text>
        {details.comment && (
          <Typography.Text type="secondary" style={{ display: 'block' }}>
            {details.comment}
          </Typography.Text>
        )}
      </div>
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        title="Якщо плани зміняться — зателефонуйте в салон, щоб звільнити час для інших клієнтів."
      />
      <Button type="primary" size="large" block loading={loading} onClick={onConfirm}>
        Підтвердити запис
      </Button>
    </>
  );
}
