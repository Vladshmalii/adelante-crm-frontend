import {
  Alert,
  App,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Radio,
  Row,
  Select,
  TimePicker,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { formatDate } from '@/shared/lib';
import {
  defaultWeek,
  WEEKDAYS,
  type WeekSchedule,
  WeekScheduleEditor,
} from '@/widgets/week-schedule';

import { useFillShifts } from '../api/shifts.api';
import { todayInSalon, toTime } from '../model/shifts';

type Row = Schema<'StaffShiftsOut'>;
type Mode = Schema<'FillIn'>['mode'];
type Report = Schema<'FillReportOut'>;

interface FormValues {
  staffIds: string[];
  period: [Dayjs, Dayjs];
  mode: Mode;
  overwrite: boolean;
  week: WeekSchedule;
  workDays: number;
  offDays: number;
  cycleStart?: Dayjs | null;
  cycleHours?: [Dayjs, Dayjs];
  cycleBreak?: [Dayjs, Dayjs] | null;
  copyFrom?: [Dayjs, Dayjs];
  markKind: 'vacation' | 'sick';
  markComment?: string;
}

const MODES: { value: Mode; label: string }[] = [
  { value: 'weekdays', label: 'По днях тижня' },
  { value: 'cycle', label: 'Цикл (2/2, 5/2…)' },
  { value: 'copy', label: 'Скопіювати період' },
  { value: 'mark', label: 'Відпустка / лікарняний' },
];

const MAX_DAYS = 62;

const SKIP_REASONS: Record<string, string> = {
  exists: 'вже заповнено',
  salon_closed: 'салон не працює',
  outside_salon_hours: 'поза годинами салону',
  has_records: 'є записи',
};

/** Форма → тело `POST /shifts/fill`. */
function toBody(v: FormValues): Schema<'FillIn'> {
  const base = {
    staffIds: v.staffIds,
    dateFrom: v.period[0].format('YYYY-MM-DD'),
    dateTo: v.period[1].format('YYYY-MM-DD'),
    mode: v.mode,
    overwrite: v.overwrite,
  };
  switch (v.mode) {
    case 'weekdays':
      return {
        ...base,
        weekdays: Object.fromEntries(
          WEEKDAYS.map((day) => {
            const d = v.week[day];
            return [
              day,
              d.isWorkDay && d.start && d.end
                ? {
                    start: d.start,
                    end: d.end,
                    breakStart: d.breakStart ?? null,
                    breakEnd: d.breakEnd ?? null,
                  }
                : null,
            ];
          }),
        ),
      };
    case 'cycle':
      return {
        ...base,
        cycle: {
          workDays: v.workDays,
          offDays: v.offDays,
          startDate: v.cycleStart ? v.cycleStart.format('YYYY-MM-DD') : null,
          shift: {
            start: toTime(v.cycleHours?.[0]) ?? '',
            end: toTime(v.cycleHours?.[1]) ?? '',
            breakStart: toTime(v.cycleBreak?.[0]),
            breakEnd: toTime(v.cycleBreak?.[1]),
          },
        },
      };
    case 'copy':
      return {
        ...base,
        copyFrom: {
          dateFrom: v.copyFrom?.[0].format('YYYY-MM-DD') ?? '',
          dateTo: v.copyFrom?.[1].format('YYYY-MM-DD') ?? '',
        },
      };
    case 'mark':
      return {
        ...base,
        mark: { kind: v.markKind, comment: v.markComment?.trim() ? v.markComment.trim() : null },
      };
  }
}

interface FillShiftsModalProps {
  open: boolean;
  /** Сотрудники, чьи смены можно менять (`canEdit`). */
  rows: Row[];
  /** Без графика салона смены не ставятся — доступна только відпустка / лікарняний. */
  salonConfigured: boolean;
  onClose: () => void;
}

/** «Заповнити на період»: смены или отметки нескольким сотрудникам сразу. */
export function FillShiftsModal({ open, rows, salonConfigured, onClose }: FillShiftsModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const fill = useFillShifts();
  const [report, setReport] = useState<Report | null>(null);
  const mode = Form.useWatch('mode', form) as Mode | undefined;
  const today = dayjs(todayInSalon());
  const names = new Map(rows.map((r) => [r.staffId, r.name]));

  return (
    <>
      <Modal
        open={open}
        title="Заповнити графік на період"
        width={880}
        onCancel={onClose}
        okText="Заповнити"
        cancelText="Скасувати"
        okButtonProps={{ loading: fill.isPending }}
        onOk={() => {
          form.submit();
        }}
        destroyOnHidden
      >
        <Form<FormValues>
          form={form}
          layout="vertical"
          preserve={false}
          initialValues={{
            staffIds: [],
            period: [today, today.add(1, 'month').subtract(1, 'day')],
            mode: salonConfigured ? 'weekdays' : 'mark',
            overwrite: false,
            week: defaultWeek(),
            workDays: 2,
            offDays: 2,
            markKind: 'vacation',
          }}
          onFinish={(values) => {
            fill.mutate(toBody(values), {
              onSuccess: (r) => {
                onClose();
                setReport(r);
              },
              onError: (e) => void message.error(errorMessage(e)),
            });
          }}
        >
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="staffIds"
                label="Співробітники"
                rules={[
                  { required: true, type: 'array', min: 1, message: 'Оберіть співробітників' },
                ]}
              >
                <Select
                  mode="multiple"
                  placeholder="Кому заповнити"
                  showSearch={{ optionFilterProp: 'label' }}
                  options={rows.map((r) => ({
                    value: r.staffId,
                    label: `${r.name}${r.role === 'administrator' ? ' (адміністратор)' : ''}`,
                  }))}
                  popupRender={(menu) => (
                    <>
                      {menu}
                      <Typography.Link
                        style={{ display: 'block', padding: '4px 12px' }}
                        onClick={() => {
                          form.setFieldValue(
                            'staffIds',
                            rows.map((r) => r.staffId),
                          );
                        }}
                      >
                        Обрати всіх
                      </Typography.Link>
                    </>
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="period"
                label="Період"
                rules={[
                  { required: true, message: 'Вкажіть період' },
                  {
                    validator: (_, value?: [Dayjs, Dayjs]) =>
                      !value || value[1].diff(value[0], 'day') < MAX_DAYS
                        ? Promise.resolve()
                        : Promise.reject(new Error(`Не більше ${MAX_DAYS} днів`)),
                  },
                ]}
              >
                <DatePicker.RangePicker
                  format="DD.MM.YYYY"
                  style={{ width: '100%' }}
                  disabledDate={(d) => d.isBefore(today, 'day')}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="mode" label="Як заповнити">
            <Radio.Group
              optionType="button"
              options={MODES.map((m) => ({
                ...m,
                disabled: !salonConfigured && m.value !== 'mark',
              }))}
            />
          </Form.Item>

          {mode === 'weekdays' && (
            <Form.Item name="week" label="Зміни по днях тижня" noStyle>
              <WeekScheduleEditor />
            </Form.Item>
          )}
          {mode === 'cycle' && (
            <Row gutter={16}>
              <Col span={4}>
                <Form.Item name="workDays" label="Робочих" rules={[{ required: true }]}>
                  <InputNumber min={1} max={14} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item name="offDays" label="Вихідних" rules={[{ required: true }]}>
                  <InputNumber min={1} max={14} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="cycleStart"
                  label="Цикл від"
                  tooltip="За замовчуванням — з початку періоду"
                >
                  <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item
                  name="cycleHours"
                  label="Години зміни"
                  rules={[{ required: true, message: 'Вкажіть години' }]}
                >
                  <TimePicker.RangePicker format="HH:mm" minuteStep={15} needConfirm={false} />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item name="cycleBreak" label="Перерва">
                  <TimePicker.RangePicker format="HH:mm" minuteStep={15} needConfirm={false} />
                </Form.Item>
              </Col>
            </Row>
          )}
          {mode === 'copy' && (
            <Form.Item
              name="copyFrom"
              label="Звідки скопіювати"
              tooltip="Зміни й відмітки цих же співробітників повторюються по колу на весь період"
              rules={[{ required: true, message: 'Вкажіть період-зразок' }]}
            >
              <DatePicker.RangePicker format="DD.MM.YYYY" />
            </Form.Item>
          )}
          {mode === 'mark' && (
            <Row gutter={16}>
              <Col span={10}>
                <Form.Item name="markKind" label="Відмітка">
                  <Radio.Group
                    optionType="button"
                    options={[
                      { value: 'vacation', label: 'Відпустка' },
                      { value: 'sick', label: 'Лікарняний' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={14}>
                <Form.Item name="markComment" label="Коментар">
                  <Input maxLength={500} />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Form.Item name="overwrite" valuePropName="checked" style={{ marginTop: 12 }}>
            <Checkbox>Перезаписати вже заповнені дні (вихідні шаблону очистять дні)</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      <FillReportModal
        report={report}
        names={names}
        onClose={() => {
          setReport(null);
        }}
      />
    </>
  );
}

function FillReportModal({
  report,
  names,
  onClose,
}: {
  report: Report | null;
  names: Map<string, string>;
  onClose: () => void;
}) {
  return (
    <Modal
      open={!!report}
      title="Графік заповнено"
      onCancel={onClose}
      onOk={onClose}
      okText="Зрозуміло"
      cancelButtonProps={{ style: { display: 'none' } }}
      width={620}
    >
      {report && (
        <>
          <Typography.Paragraph>
            Створено: <b>{report.created}</b>, оновлено: <b>{report.updated}</b>, очищено:{' '}
            <b>{report.removed}</b>
          </Typography.Paragraph>
          {report.skipped.length > 0 && (
            <>
              <Alert type="warning" showIcon title={`Пропущено днів: ${report.skipped.length}`} />
              <List
                size="small"
                style={{ maxHeight: 320, overflow: 'auto' }}
                dataSource={report.skipped}
                renderItem={(s) => (
                  <List.Item>
                    {names.get(s.staffId) ?? 'Співробітник'} · {formatDate(s.date)} —{' '}
                    {SKIP_REASONS[s.reason] ?? s.message}
                  </List.Item>
                )}
              />
            </>
          )}
        </>
      )}
    </Modal>
  );
}
