import { PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProForm,
  ProFormDateRangePicker,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { App, Button, Form, Modal, Result, Spin, Table, Tabs, Tag, TimePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { formatDate } from '@/shared/lib';
import { type WeekSchedule, weekFromApi, WeekScheduleEditor } from '@/widgets/week-schedule';

import { useAddScheduleException, useSaveSchedule } from '../api/staff.mutations';
import { staffScheduleQueryOptions } from '../api/staff.queries';
import { exceptionTypeLabels, staffFullName } from '../model/labels';

type Staff = Schema<'StaffOut'>;
type Exception = Schema<'ExceptionOut'>;

interface StaffScheduleModalProps {
  staff: Staff | null;
  onClose: () => void;
}

export function StaffScheduleModal({ staff, onClose }: StaffScheduleModalProps) {
  return (
    <Modal
      title={staff ? `Графік роботи: ${staffFullName(staff)}` : 'Графік роботи'}
      open={!!staff}
      onCancel={onClose}
      footer={null}
      width={820}
      destroyOnHidden
    >
      {staff && <ScheduleContent staffId={staff.id} onSaved={onClose} />}
    </Modal>
  );
}

function ScheduleContent({ staffId, onSaved }: { staffId: string; onSaved: () => void }) {
  const { data, isPending, isError, error } = useQuery(staffScheduleQueryOptions(staffId));

  if (isError)
    return <Result status="error" title="Не вдалося завантажити графік" subTitle={error.message} />;
  if (isPending) return <Spin />;

  return (
    <Tabs
      items={[
        {
          key: 'week',
          label: 'Тиждень',
          children: (
            <WeekForm staffId={staffId} initial={weekFromApi(data.week)} onSaved={onSaved} />
          ),
        },
        {
          key: 'exceptions',
          label: `Винятки (${data.exceptions.length})`,
          children: <Exceptions staffId={staffId} exceptions={data.exceptions} />,
        },
      ]}
    />
  );
}

function WeekForm(props: { staffId: string; initial: WeekSchedule; onSaved: () => void }) {
  const { message } = App.useApp();
  const save = useSaveSchedule(props.staffId);

  return (
    <Form<{ week: WeekSchedule }>
      initialValues={{ week: props.initial }}
      onFinish={async ({ week }) => {
        try {
          await save.mutateAsync(week);
          message.success('Графік збережено');
          props.onSaved();
        } catch (error) {
          message.error(errorMessage(error));
        }
      }}
    >
      <Form.Item name="week" noStyle>
        <WeekScheduleEditor />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={save.isPending} style={{ marginTop: 16 }}>
        Зберегти графік
      </Button>
    </Form>
  );
}

const time = (value: string | null | undefined) => value?.slice(0, 5) ?? '';

function Exceptions({ staffId, exceptions }: { staffId: string; exceptions: Exception[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        icon={<PlusOutlined />}
        onClick={() => {
          setOpen(true);
        }}
        style={{ marginBottom: 16 }}
      >
        Додати виняток
      </Button>
      <Table<Exception>
        size="small"
        rowKey="id"
        pagination={false}
        dataSource={exceptions}
        locale={{ emptyText: 'Винятків немає' }}
        columns={[
          {
            title: 'Тип',
            dataIndex: 'type',
            render: (_, e) => (
              <Tag color={exceptionTypeLabels[e.type].color}>
                {exceptionTypeLabels[e.type].text}
              </Tag>
            ),
          },
          {
            title: 'Період',
            key: 'dates',
            render: (_, e) =>
              e.dateFrom === e.dateTo
                ? formatDate(e.dateFrom)
                : `${formatDate(e.dateFrom)} — ${formatDate(e.dateTo)}`,
          },
          {
            title: 'Час',
            key: 'time',
            render: (_, e) => (e.start ? `${time(e.start)}–${time(e.end)}` : 'Весь день'),
          },
          { title: 'Коментар', dataIndex: 'comment' },
        ]}
      />
      <ExceptionForm staffId={staffId} open={open} onOpenChange={setOpen} />
    </>
  );
}

interface ExceptionValues {
  dates: [Dayjs, Dayjs];
  type: Schema<'ScheduleExceptionType'>;
  time?: [Dayjs, Dayjs] | null;
  comment?: string;
}

function ExceptionForm(props: {
  staffId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { message } = App.useApp();
  const add = useAddScheduleException(props.staffId);

  return (
    <ModalForm<ExceptionValues>
      title="Виняток з графіка"
      width={480}
      open={props.open}
      onOpenChange={props.onOpenChange}
      // Даты и время нужны как Dayjs — форматируем сами (иначе ProForm превратит время в дату).
      dateFormatter={false}
      modalProps={{ destroyOnHidden: true }}
      initialValues={{ type: 'vacation' }}
      submitter={{ searchConfig: { submitText: 'Додати', resetText: 'Скасувати' } }}
      onFinish={async ({ dates, type, time: range, comment }) => {
        try {
          await add.mutateAsync({
            dateFrom: dates[0].format('YYYY-MM-DD'),
            dateTo: dates[1].format('YYYY-MM-DD'),
            type,
            start: range?.[0].format('HH:mm') ?? null,
            end: range?.[1].format('HH:mm') ?? null,
            comment: comment?.trim() ? comment : null,
          });
          message.success('Виняток додано');
          return true;
        } catch (error) {
          message.error(errorMessage(error));
          return false;
        }
      }}
    >
      <ProFormSelect
        name="type"
        label="Тип"
        allowClear={false}
        options={Object.entries(exceptionTypeLabels).map(([value, { text }]) => ({
          value,
          label: text,
        }))}
      />
      <ProFormDateRangePicker
        name="dates"
        label="Дати"
        fieldProps={{ style: { width: '100%' } }}
        rules={[{ required: true, message: 'Вкажіть дати' }]}
      />
      <ProForm.Item name="time" label="Час" tooltip="Порожньо — весь день">
        <TimePicker.RangePicker format="HH:mm" minuteStep={15} style={{ width: '100%' }} />
      </ProForm.Item>
      <ProFormTextArea name="comment" label="Коментар" />
    </ModalForm>
  );
}
