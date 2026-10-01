import { StarFilled } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { Alert, App, Button, Form, Input, Rate, Result, Spin, Typography } from 'antd';
import { useState } from 'react';

import { ApiError, errorMessage } from '@/shared/api';

import { reviewContextQueryOptions, useCreateReview } from '../api/booking.api';
import { visitDate, visitTime } from '../model/booking';
import { BookingCard, BookingShell } from './BookingShell';

const route = getRouteApi('/booking/$slug/review');

const RATE_HINTS = ['Жахливо', 'Погано', 'Нормально', 'Добре', 'Чудово'];

/** Отзыв по ссылке из Telegram после визита: оценка 1–5 и текст. Ссылка одноразовая. */
export function ReviewPage() {
  const { slug } = route.useParams();
  const { token } = route.useSearch();
  const { message } = App.useApp();
  const context = useQuery({ ...reviewContextQueryOptions(slug, token ?? ''), enabled: !!token });
  const create = useCreateReview(slug);
  const [done, setDone] = useState(false);

  const invalid = !token || (context.error instanceof ApiError && context.error.status === 404);

  return (
    <BookingShell>
      <BookingCard>
        {invalid ? (
          <Result
            status="warning"
            title="Посилання недійсне"
            subTitle="Відгук за цим посиланням уже залишили або посилання застаріло."
          />
        ) : done ? (
          <Result
            status="success"
            icon={<StarFilled style={{ color: '#fadb14' }} />}
            title="Дякуємо за відгук!"
            subTitle="Ваша думка допомагає нам ставати кращими."
          />
        ) : context.isPending ? (
          <Spin style={{ display: 'block', margin: '60px auto' }} />
        ) : context.isError ? (
          <Result
            status="error"
            title="Не вдалося завантажити"
            subTitle={errorMessage(context.error)}
          />
        ) : (
          <>
            <Typography.Title level={3} style={{ marginTop: 0, textAlign: 'center' }}>
              Як пройшов візит?
            </Typography.Title>
            <Alert
              type="info"
              style={{ marginBottom: 20 }}
              title={context.data.salon_name}
              description={
                <>
                  {context.data.services.join(', ')} · майстер {context.data.master_name}
                  <br />
                  <span style={{ textTransform: 'capitalize' }}>
                    {visitDate(context.data.visit_at)}
                  </span>
                  , {visitTime(context.data.visit_at)}
                </>
              }
            />
            <Form<{ rating: number; text?: string }>
              layout="vertical"
              size="large"
              onFinish={(v) => {
                create.mutate(
                  { token, rating: v.rating, text: v.text?.trim() ? v.text.trim() : null },
                  {
                    onSuccess: () => {
                      setDone(true);
                    },
                    onError: (e) => void message.error(errorMessage(e)),
                  },
                );
              }}
            >
              <Form.Item
                name="rating"
                label="Ваша оцінка"
                rules={[{ required: true, message: 'Оберіть оцінку' }]}
              >
                <Rate tooltips={RATE_HINTS} style={{ fontSize: 36 }} />
              </Form.Item>
              <Form.Item name="text" label="Що сподобалось або що покращити? (необов'язково)">
                <Input.TextArea rows={4} maxLength={2000} />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={create.isPending}>
                Надіслати відгук
              </Button>
            </Form>
          </>
        )}
      </BookingCard>
    </BookingShell>
  );
}
