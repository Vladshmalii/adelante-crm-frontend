import { Result, Typography } from 'antd';

import { BookingCard, BookingShell } from './BookingShell';

/**
 * `/booking` без салона. Список салонов появится, когда бекенд добавит публичный
 * `GET /api/booking/salons` (web/docs/BACKEND_BOOKING.md, п. 1); пока — подсказка.
 */
export function SalonsPage() {
  return (
    <BookingShell>
      <Typography.Title level={2} style={{ textAlign: 'center' }}>
        Онлайн запис
      </Typography.Title>
      <BookingCard>
        <Result
          status="info"
          title="Оберіть салон"
          subTitle="Відкрийте посилання на онлайн-запис вашого салону — з сайту, Instagram або Telegram-бота."
        />
      </BookingCard>
    </BookingShell>
  );
}
