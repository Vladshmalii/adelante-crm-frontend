import { CopyOutlined } from '@ant-design/icons';
import { Button, Switch, Table, TimePicker, Tooltip } from 'antd';

import {
  type DaySchedule,
  DAY_LABELS,
  defaultWeek,
  toDayjs,
  toTime,
  type Weekday,
  WEEKDAYS,
  type WeekSchedule,
} from './schedule';

interface WeekScheduleEditorProps {
  value?: WeekSchedule;
  onChange?: (value: WeekSchedule) => void;
  /** Показывать ли перерыв (у салона его нет, у сотрудника — есть). */
  withBreak?: boolean;
}

/** Недельный график для Form: рабочий день, часы работы, перерыв, «скопировать на все дни». */
export function WeekScheduleEditor({
  value = defaultWeek(),
  onChange,
  withBreak = true,
}: WeekScheduleEditorProps) {
  const patch = (day: Weekday, changes: Partial<DaySchedule>) => {
    onChange?.({ ...value, [day]: { ...value[day], ...changes } });
  };
  const copyToAll = (source: Weekday) => {
    onChange?.(
      Object.fromEntries(WEEKDAYS.map((day) => [day, { ...value[source] }])) as WeekSchedule,
    );
  };

  return (
    <Table<{ day: Weekday } & DaySchedule>
      size="small"
      pagination={false}
      rowKey="day"
      dataSource={WEEKDAYS.map((day) => ({ day, ...value[day] }))}
      columns={[
        { title: 'День', dataIndex: 'day', render: (day: Weekday) => DAY_LABELS[day] },
        {
          title: 'Працює',
          dataIndex: 'isWorkDay',
          render: (_, row) => (
            <Switch
              checked={row.isWorkDay}
              onChange={(isWorkDay) => {
                patch(
                  row.day,
                  isWorkDay
                    ? { isWorkDay, start: row.start ?? '09:00', end: row.end ?? '18:00' }
                    : { isWorkDay },
                );
              }}
            />
          ),
        },
        {
          title: 'Години роботи',
          key: 'hours',
          render: (_, row) => (
            <TimePicker.RangePicker
              format="HH:mm"
              minuteStep={15}
              disabled={!row.isWorkDay}
              allowClear={false}
              value={[toDayjs(row.start), toDayjs(row.end)]}
              onChange={(range) => {
                patch(row.day, { start: toTime(range?.[0]), end: toTime(range?.[1]) });
              }}
            />
          ),
        },
        ...(withBreak
          ? [
              {
                title: 'Перерва',
                key: 'break',
                render: (_: unknown, row: { day: Weekday } & DaySchedule) => (
                  <TimePicker.RangePicker
                    format="HH:mm"
                    minuteStep={15}
                    disabled={!row.isWorkDay}
                    placeholder={['Без перерви', '']}
                    allowEmpty={[true, true]}
                    value={[toDayjs(row.breakStart), toDayjs(row.breakEnd)]}
                    onChange={(range) => {
                      patch(row.day, {
                        breakStart: toTime(range?.[0]),
                        breakEnd: toTime(range?.[1]),
                      });
                    }}
                  />
                ),
              },
            ]
          : []),
        {
          title: '',
          key: 'copy',
          width: 48,
          render: (_, row) => (
            <Tooltip title="Скопіювати на всі дні">
              <Button
                type="text"
                aria-label="Скопіювати на всі дні"
                icon={<CopyOutlined />}
                onClick={() => {
                  copyToAll(row.day);
                }}
              />
            </Tooltip>
          ),
        },
      ]}
    />
  );
}
