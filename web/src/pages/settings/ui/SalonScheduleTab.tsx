import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Alert, App, Button, Card, Form, List, Modal, Space, Spin, Typography } from 'antd';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { formatDate, inSalonTz } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';
import {
  DAY_LABELS,
  WEEKDAYS,
  type WeekSchedule,
  weekFromApi,
  WeekScheduleEditor,
} from '@/widgets/week-schedule';

import { salonScheduleQueryOptions, useSaveSalonSchedule } from '../api/settings.api';

type TrimReport = Schema<'ShiftTrimOut'>;

/** Неделя редактора → тело PUT: все семь дней, у выходного время не отправляем. */
const toApi = (week: WeekSchedule): Record<string, Schema<'SalonDay'>> =>
  Object.fromEntries(
    WEEKDAYS.map((day) => {
      const d = week[day];
      return [
        day,
        d.isWorkDay ? { isWorkDay: true, start: d.start, end: d.end } : { isWorkDay: false },
      ];
    }),
  );

/** Рабочий день без часов или с концом раньше начала — подсказываем до отправки. */
const invalidDays = (week: WeekSchedule) =>
  WEEKDAYS.filter((day) => {
    const d = week[day];
    return d.isWorkDay && (!d.start || !d.end || d.start >= d.end);
  });

/**
 * «Графік роботи» салона — границы смен сотрудников. После сохранения бекенд подгоняет будущие
 * смены под новые часы; смены с записями на обрезаемое время не трогает (конфликты).
 */
export function SalonScheduleTab() {
  const { message } = App.useApp();
  const { data, error, isPending, refetch } = useQuery(salonScheduleQueryOptions());
  const save = useSaveSalonSchedule();
  const [report, setReport] = useState<TrimReport | null>(null);

  if (isPending) return <Spin />;
  if (error) return <QueryErrorAlert error={error} onRetry={() => void refetch()} />;

  return (
    <Card>
      {!data.configured && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          title="Графік ще не заповнено"
          description="Поки графік салону не заповнений, змін співробітникам поставити не можна."
        />
      )}
      <Form<{ week: WeekSchedule }>
        key={JSON.stringify(data)}
        layout="vertical"
        initialValues={{ week: weekFromApi(data.week) }}
        onFinish={({ week }) => {
          const bad = invalidDays(week);
          if (bad.length) {
            void message.error(
              `Перевірте години: ${bad.map((d) => DAY_LABELS[d]).join(', ')} — початок має бути раніше кінця`,
            );
            return;
          }
          save.mutate(toApi(week), {
            onSuccess: ({ shifts }) => {
              void message.success('Графік салону збережено');
              if (shifts.trimmed || shifts.removed || shifts.conflicts.length) setReport(shifts);
            },
            onError: (e) => void message.error(errorMessage(e)),
          });
        }}
      >
        <Form.Item name="week" noStyle>
          <WeekScheduleEditor withBreak={false} />
        </Form.Item>
        <Space style={{ marginTop: 16 }}>
          <Button type="primary" htmlType="submit" loading={save.isPending}>
            Зберегти
          </Button>
          <Typography.Text type="secondary">
            Зміни співробітників обмежені цими годинами; при зміні годин майбутні зміни
            підлаштуються автоматично.
          </Typography.Text>
        </Space>
      </Form>
      <TrimReportModal
        report={report}
        onClose={() => {
          setReport(null);
        }}
      />
    </Card>
  );
}

/** Итог подгонки смен: сколько обрезано и удалено, какие дни не тронуты из-за записей. */
function TrimReportModal({ report, onClose }: { report: TrimReport | null; onClose: () => void }) {
  return (
    <Modal
      open={!!report}
      title="Зміни співробітників підлаштовано під нові години"
      onCancel={onClose}
      onOk={onClose}
      okText="Зрозуміло"
      cancelButtonProps={{ style: { display: 'none' } }}
      width={640}
    >
      {report && (
        <Space orientation="vertical" style={{ display: 'flex' }}>
          <Typography.Text>
            Обрізано змін: <b>{report.trimmed}</b>, видалено: <b>{report.removed}</b>
          </Typography.Text>
          {report.conflicts.length > 0 && (
            <>
              <Alert
                type="warning"
                showIcon
                title="Ці зміни не змінено: на час, що обрізається, є записи"
                description="Перенесіть записи і поправте зміну в «Графік роботи»."
              />
              <List
                size="small"
                dataSource={report.conflicts}
                renderItem={(c) => (
                  <List.Item>
                    <Space orientation="vertical" size={0}>
                      <Typography.Text strong>
                        {c.staffName ?? 'Співробітник'} · {formatDate(c.date)}
                      </Typography.Text>
                      {c.records.map((r) => (
                        <Link key={r.id} to="/calendar" search={{ date: c.date, recordId: r.id }}>
                          {inSalonTz(r.startAt).format('HH:mm')}–
                          {inSalonTz(r.endAt).format('HH:mm')} {r.clientName}
                        </Link>
                      ))}
                    </Space>
                  </List.Item>
                )}
              />
            </>
          )}
        </Space>
      )}
    </Modal>
  );
}
