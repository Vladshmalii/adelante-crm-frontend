import { useQuery } from '@tanstack/react-query';
import { Calendar, Empty, Modal, Space, Spin, theme, Typography } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';

import type { Schema } from '@/shared/api';

import { calendarRecordsQueryOptions } from '../api/calendar.queries';
import { asDay, todayInSalon } from '../model/time';
import { RecordCard } from './RecordCard';

type DaySummary = Schema<'DaySummaryOut'>;
type RecordItem = Schema<'RecordOut'>;

interface MonthViewProps {
  date: string;
  summary: DaySummary[];
  /** Имена и цвета мастеров — из графика (мастеру `/staff` недоступен). */
  masters: Map<string, { name: string; color: string | null }>;
  onOpenDay: (date: string) => void;
  onOpen: (record: RecordItem) => void;
}

const MAX_MASTERS = 3;

/** Месяц: в дне — до трёх мастеров с числом записей и «+N ще»; клик — записи дня. */
export function MonthView({ date, summary, masters, onOpenDay, onOpen }: MonthViewProps) {
  const { token } = theme.useToken();
  const byDate = new Map(summary.map((s) => [s.date, s]));
  const [openDate, setOpenDate] = useState<string | null>(null);
  const today = todayInSalon();
  const month = asDay(date).month();

  return (
    <>
      <Calendar
        value={dayjs(date)}
        headerRender={() => null}
        onSelect={(d, { source }) => {
          if (source !== 'date') return;
          const key = d.format('YYYY-MM-DD');
          if ((byDate.get(key)?.total ?? 0) > 0) setOpenDate(key);
          else onOpenDay(key);
        }}
        fullCellRender={(current, info) => {
          if (info.type !== 'date') return info.originNode;
          const key = current.format('YYYY-MM-DD');
          const day = byDate.get(key);
          const shown = day?.byMaster.slice(0, MAX_MASTERS) ?? [];
          const rest = (day?.byMaster.length ?? 0) - shown.length;
          return (
            <div
              style={{
                margin: 2,
                padding: 6,
                minHeight: 108,
                textAlign: 'left',
                borderRadius: token.borderRadius,
                borderTop: `2px solid ${key === today ? token.colorPrimary : token.colorBorderSecondary}`,
                background: key === today ? token.colorPrimaryBg : undefined,
                opacity: current.month() === month ? 1 : 0.45,
              }}
            >
              <Typography.Text strong={key === today}>{current.date()}</Typography.Text>
              <Space orientation="vertical" size={2} style={{ display: 'flex', marginTop: 4 }}>
                {shown.map((m) => {
                  const master = m.masterId ? masters.get(m.masterId) : undefined;
                  return (
                    <div
                      key={m.masterId ?? 'queue'}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 4,
                        fontSize: token.fontSizeSM,
                        padding: '0 6px',
                        borderRadius: token.borderRadiusSM,
                        background: token.colorFillQuaternary,
                        borderLeft: `3px solid ${master?.color ?? token.colorPrimary}`,
                      }}
                    >
                      <Typography.Text ellipsis style={{ fontSize: 'inherit' }}>
                        {m.masterId ? (master?.name ?? 'Майстер') : 'Без майстра'}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 'inherit' }}>
                        {m.count}
                      </Typography.Text>
                    </div>
                  );
                })}
                {rest > 0 && (
                  <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                    +{rest} ще
                  </Typography.Text>
                )}
              </Space>
            </div>
          );
        }}
      />
      <DayRecordsModal
        date={openDate}
        onClose={() => {
          setOpenDate(null);
        }}
        onOpenDay={(d) => {
          setOpenDate(null);
          onOpenDay(d);
        }}
        onOpen={(r) => {
          setOpenDate(null);
          onOpen(r);
        }}
      />
    </>
  );
}

function DayRecordsModal({
  date,
  onClose,
  onOpenDay,
  onOpen,
}: {
  date: string | null;
  onClose: () => void;
  onOpenDay: (date: string) => void;
  onOpen: (r: RecordItem) => void;
}) {
  const { data, isPending } = useQuery({
    ...calendarRecordsQueryOptions(date ?? '', date ?? ''),
    enabled: !!date,
  });
  const records = (data ?? [])
    .filter((r) => r.status !== 'cancelled')
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  return (
    <Modal
      open={!!date}
      onCancel={onClose}
      title={date ? asDay(date).format('D MMMM YYYY') : ''}
      okText="Відкрити день"
      cancelText="Закрити"
      onOk={() => {
        if (date) onOpenDay(date);
      }}
      destroyOnHidden
    >
      {isPending ? (
        <Spin />
      ) : records.length ? (
        <Space orientation="vertical" style={{ display: 'flex', maxHeight: 480, overflow: 'auto' }}>
          <Typography.Text type="secondary">Записів: {records.length}</Typography.Text>
          {records.map((r) => (
            <div key={r.id}>
              <Typography.Text type="secondary">{r.master?.name ?? 'Без майстра'}</Typography.Text>
              <RecordCard
                record={r}
                size="medium"
                onClick={() => {
                  onOpen(r);
                }}
              />
            </div>
          ))}
        </Space>
      ) : (
        <Empty description="Записів немає" />
      )}
    </Modal>
  );
}
