import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Calendar, Col, Empty, Flex, Row, Spin, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';

import type { Schema } from '@/shared/api';
import { inSalonTz } from '@/shared/lib';
import { lightPalette, withAlpha } from '@/shared/theme';
import { QueryErrorAlert } from '@/shared/ui';

import { availabilityQueryOptions, slotsQueryOptions } from '../api/booking.api';
import { DAY_PART_LABELS, monthOf, slotsByPart, visitTime } from '../model/booking';
import { ANY_MASTER } from '../model/search';
import { StepTitle } from './BookingShell';

type Service = Schema<'app__api__booking__router__ServiceOut'>;

/** Запись открыта на 30 дней вперёд (как на бекенде). */
const HORIZON_DAYS = 30;

interface DateTimeStepProps {
  slug: string;
  service: Service;
  master: string;
  date?: string;
  slot?: string;
  onDate: (date: string) => void;
  onSlot: (slot: string) => void;
}

/** Шаг 3: день из доступных (подсветка) и свободное время кнопками по частям дня. */
export function DateTimeStep({
  slug,
  service,
  master,
  date,
  slot,
  onDate,
  onSlot,
}: DateTimeStepProps) {
  const masterId = master === ANY_MASTER ? null : master;
  const today = inSalonTz(new Date()).format('YYYY-MM-DD');
  const lastDay = dayjs(today).add(HORIZON_DAYS, 'day');
  const [panel, setPanel] = useState<Dayjs>(dayjs(date ?? today).startOf('month'));

  const month = monthOf(panel.format('YYYY-MM-DD'));
  const availability = useQuery(availabilityQueryOptions(slug, service.id, masterId, month));
  const available = new Set(availability.data ?? []);
  const canPrev = panel.isAfter(dayjs(today), 'month');
  const canNext = panel.isBefore(lastDay, 'month');

  return (
    <>
      <StepTitle title="Оберіть дату і час" subtitle="Виберіть зручний час для візиту" />
      <QueryErrorAlert error={availability.error} onRetry={() => void availability.refetch()} />
      <Row gutter={[24, 16]}>
        <Col xs={24} md={12}>
          <div
            style={{
              background: withAlpha(lightPalette.muted, 0.3),
              borderRadius: 12,
              padding: 12,
            }}
          >
            <Calendar
              fullscreen={false}
              value={date ? dayjs(date) : panel}
              onPanelChange={(d) => {
                setPanel(d.startOf('month'));
              }}
              disabledDate={(d) => !available.has(d.format('YYYY-MM-DD'))}
              onSelect={(d, { source }) => {
                if (source === 'date' && available.has(d.format('YYYY-MM-DD')))
                  onDate(d.format('YYYY-MM-DD'));
              }}
              headerRender={() => (
                <Flex justify="space-between" align="center" style={{ padding: '4px 4px 8px' }}>
                  <Button
                    type="text"
                    aria-label="Попередній місяць"
                    icon={<LeftOutlined />}
                    disabled={!canPrev}
                    onClick={() => {
                      setPanel(panel.subtract(1, 'month'));
                    }}
                  />
                  <Typography.Text strong style={{ textTransform: 'capitalize' }}>
                    {panel.format('MMMM YYYY')}
                  </Typography.Text>
                  <Button
                    type="text"
                    aria-label="Наступний місяць"
                    icon={<RightOutlined />}
                    disabled={!canNext}
                    onClick={() => {
                      setPanel(panel.add(1, 'month'));
                    }}
                  />
                </Flex>
              )}
            />
            {availability.isFetching && <Spin size="small" style={{ display: 'block' }} />}
            {!availability.isFetching && available.size === 0 && (
              <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
                У цьому місяці вільного часу немає
                {canNext ? ' — перегляньте наступний' : ''}
              </Typography.Text>
            )}
          </div>
        </Col>
        <Col xs={24} md={12}>
          {date ? (
            <Slots
              slug={slug}
              serviceId={service.id}
              masterId={masterId}
              date={date}
              selected={slot}
              onSelect={onSlot}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Оберіть день, щоб побачити вільний час"
            />
          )}
        </Col>
      </Row>
    </>
  );
}

function Slots({
  slug,
  serviceId,
  masterId,
  date,
  selected,
  onSelect,
}: {
  slug: string;
  serviceId: string;
  masterId: string | null;
  date: string;
  selected?: string;
  onSelect: (slot: string) => void;
}) {
  const {
    data = [],
    isPending,
    error,
    refetch,
  } = useQuery(slotsQueryOptions(slug, serviceId, masterId, date));
  if (isPending) return <Spin style={{ display: 'block', margin: '40px auto' }} />;
  return (
    <>
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <Typography.Text
        strong
        style={{ display: 'block', marginBottom: 12, textTransform: 'capitalize' }}
      >
        {/* Календарный день без времени — без пересчёта пояса. */}
        {dayjs(date).format('dddd, D MMMM')}
      </Typography.Text>
      {data.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="На цей день вільного часу немає" />
      ) : (
        slotsByPart(data).map(([part, slots]) => (
          <div key={part} style={{ marginBottom: 12 }}>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
              {DAY_PART_LABELS[part]}
            </Typography.Text>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
                gap: 8,
              }}
            >
              {slots.map((s) => {
                const active = s.start_at === selected;
                return (
                  <Button
                    key={s.start_at}
                    type={active ? 'primary' : 'default'}
                    style={
                      active ? undefined : { borderColor: withAlpha(lightPalette.primary, 0.2) }
                    }
                    onClick={() => {
                      onSelect(s.start_at);
                    }}
                  >
                    {visitTime(s.start_at)}
                  </Button>
                );
              })}
            </div>
          </div>
        ))
      )}
    </>
  );
}
