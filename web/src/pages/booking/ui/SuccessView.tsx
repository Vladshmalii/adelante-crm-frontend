import {
  CalendarOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ScissorOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';

import type { Schema } from '@/shared/api';
import { env } from '@/shared/config';
import { formatMoney, formatPhone, saveBlob } from '@/shared/lib';
import { lightPalette, withAlpha } from '@/shared/theme';

import { buildIcs, visitDate, visitTime } from '../model/booking';
import { BookingCard } from './BookingShell';
import { SummaryRow } from './ConfirmStep';

type Booking = Schema<'BookingOut'>;
type Salon = Schema<'app__api__booking__router__SalonOut'>;

interface SuccessViewProps {
  booking: Booking;
  salon: Salon;
  onNewBooking: () => void;
}

/** «Запис підтверджено!»: детали, контакты салона, календарь и напоминания в Telegram. */
export function SuccessView({ booking, salon, onNewBooking }: SuccessViewProps) {
  const address = [salon.city, salon.address].filter(Boolean).join(', ');

  const addToCalendar = () => {
    const ics = buildIcs({
      uid: booking.record_id,
      start: booking.start_at,
      end: booking.end_at,
      title: `${booking.service_name} — ${salon.name}`,
      location: address || null,
      description: `Майстер: ${booking.master_name}${salon.phone ? `. Телефон салону: ${salon.phone}` : ''}`,
    });
    saveBlob(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), 'zapys.ics');
  };

  return (
    <BookingCard style={{ textAlign: 'center' }}>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          margin: '0 auto 16px',
          // bg-success/20, иконка text-success
          background: withAlpha(lightPalette.success, 0.2),
          color: lightPalette.success,
          fontSize: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckOutlined />
      </div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Запис підтверджено!
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Чекаємо на вас у салоні «{salon.name}».
      </Typography.Paragraph>

      <div
        style={{
          textAlign: 'left',
          maxWidth: 420,
          margin: '0 auto',
          padding: '8px 16px',
          borderRadius: 16,
          background: withAlpha(lightPalette.muted, 0.6),
        }}
      >
        <SummaryRow icon={<ScissorOutlined />} label="Послуга">
          {booking.service_name} · {formatMoney(booking.price)}
        </SummaryRow>
        <SummaryRow icon={<UserOutlined />} label="Майстер">
          {booking.master_name}
        </SummaryRow>
        <SummaryRow icon={<CalendarOutlined />} label="Дата">
          <span style={{ textTransform: 'capitalize' }}>{visitDate(booking.start_at)}</span>
        </SummaryRow>
        <SummaryRow icon={<ClockCircleOutlined />} label="Час">
          {visitTime(booking.start_at)}–{visitTime(booking.end_at)}
        </SummaryRow>
        {address && (
          <SummaryRow icon={<EnvironmentOutlined />} label="Адреса">
            {address}
          </SummaryRow>
        )}
        {salon.phone && (
          <SummaryRow icon={<PhoneOutlined />} label="Телефон салону">
            <Typography.Link href={`tel:${salon.phone}`}>
              {formatPhone(salon.phone)}
            </Typography.Link>
          </SummaryRow>
        )}
      </div>

      <Space
        orientation="vertical"
        style={{ display: 'flex', maxWidth: 420, margin: '16px auto 0' }}
      >
        <Button
          type="primary"
          size="large"
          block
          icon={<SendOutlined />}
          href={`${env.telegramBotUrl}?start=${encodeURIComponent(salon.slug)}`}
          target="_blank"
        >
          Нагадування в Telegram
        </Button>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Відкрийте бота і поділіться контактом — нагадаємо про візит за 30 хвилин.
        </Typography.Text>
        <Button size="large" block icon={<CalendarOutlined />} onClick={addToCalendar}>
          Додати в календар
        </Button>
        <Button type="link" onClick={onNewBooking}>
          Записатися ще
        </Button>
      </Space>
    </BookingCard>
  );
}
