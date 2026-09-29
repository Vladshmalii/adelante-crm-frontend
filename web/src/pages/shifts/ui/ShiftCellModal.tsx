import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  Alert,
  App,
  Button,
  Divider,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Radio,
  Space,
  TimePicker,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';

import { type ConflictRecord, conflictRecords, errorMessage, type Schema } from '@/shared/api';
import { inSalonTz, recordStatusLabels } from '@/shared/lib';

import { masterDayRecordsQueryOptions, useSaveShift } from '../api/shifts.api';
import {
  type CellFormValues,
  cellBody,
  cellValues,
  clock,
  hoursOutside,
  isPast,
  shiftFieldErrors,
} from '../model/shifts';

type Row = Schema<'StaffShiftsOut'>;
type Cell = Schema<'ShiftCellOut'>;
type SalonDay = Schema<'SalonDayHoursOut'>;

export interface OpenCell {
  row: Row;
  cell: Cell;
  salon: SalonDay | undefined;
  /** Без графика салона смену поставить нельзя — только відпустку або лікарняний. */
  salonConfigured: boolean;
}

const KIND_OPTIONS = [
  { value: 'shift', label: 'Зміна' },
  { value: 'vacation', label: 'Відпустка' },
  { value: 'sick', label: 'Лікарняний' },
  { value: 'off', label: 'Вихідний' },
];

/**
 * Ячейка «сотрудник × дата»: смена (с–по, перерыв), відпустка / лікарняний или выходной, и записи
 * мастера на этот день. Прошлые дни и чужие строки без прав — только просмотр.
 */
export function ShiftCellModal({ open, onClose }: { open: OpenCell | null; onClose: () => void }) {
  if (!open) return null;
  return <CellForm key={`${open.row.staffId}-${open.cell.date}`} open={open} onClose={onClose} />;
}

function CellForm({ open, onClose }: { open: OpenCell; onClose: () => void }) {
  const { row, cell, salon, salonConfigured } = open;
  const { message } = App.useApp();
  const [form] = Form.useForm<CellFormValues>();
  const save = useSaveShift();
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const readOnly = !row.canEdit || isPast(cell.date);
  const kind = Form.useWatch('kind', form) as CellFormValues['kind'] | undefined;
  const closed = salon ? !salon.open : false;
  const disabledHours = hoursOutside(salon?.open ?? null, salon?.close ?? null);

  const submit = (values: CellFormValues) => {
    setConflicts([]);
    save.mutate(
      { staffId: row.staffId, date: cell.date, body: cellBody(values) },
      {
        onSuccess: () => {
          void message.success('Графік збережено');
          onClose();
        },
        onError: (e) => {
          setConflicts(conflictRecords(e));
          form.setFields(shiftFieldErrors(e));
          void message.error(errorMessage(e));
        },
      },
    );
  };

  return (
    <Modal
      open
      title={`${row.name} · ${dayjs(cell.date).format('dddd, D MMMM')}`}
      onCancel={onClose}
      width={560}
      footer={
        readOnly
          ? [
              <Button key="close" onClick={onClose}>
                Закрити
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={onClose}>
                Скасувати
              </Button>,
              <Button
                key="save"
                type="primary"
                loading={save.isPending}
                onClick={() => {
                  form.submit();
                }}
              >
                Зберегти
              </Button>,
            ]
      }
    >
      {readOnly && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          title={
            isPast(cell.date) ? 'Минулі дні змінювати не можна' : 'Немає прав змінювати цей графік'
          }
        />
      )}
      {!salonConfigured && !readOnly && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          title="Графік салону ще не заповнено — зміну поставити не можна, лише відмітку"
        />
      )}
      {closed && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          title="Салон у цей день не працює — зміну поставити не можна, лише відмітку"
        />
      )}
      <Form<CellFormValues>
        form={form}
        layout="vertical"
        disabled={readOnly}
        initialValues={cellValues(cell)}
        onFinish={submit}
      >
        <Form.Item name="kind">
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            options={KIND_OPTIONS.map((o) => ({
              ...o,
              disabled: o.value === 'shift' && (!salonConfigured || closed),
            }))}
          />
        </Form.Item>
        {kind === 'shift' && (
          <>
            <Form.Item
              name="hours"
              label={
                salon?.open
                  ? `Години зміни (салон працює ${clock(salon.open)}–${clock(salon.close)})`
                  : 'Години зміни'
              }
              rules={[{ required: true, message: 'Вкажіть початок і кінець зміни' }]}
            >
              <TimePicker.RangePicker
                format="HH:mm"
                minuteStep={15}
                needConfirm={false}
                disabledTime={() => ({ disabledHours: () => disabledHours })}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item name="breakHours" label="Перерва (необов'язково)">
              <TimePicker.RangePicker
                format="HH:mm"
                minuteStep={15}
                needConfirm={false}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </>
        )}
        {kind !== 'off' && (
          <Form.Item name="comment" label="Коментар">
            <Input maxLength={500} placeholder={kind === 'shift' ? '' : 'Наприклад: до 14.10'} />
          </Form.Item>
        )}
      </Form>

      {conflicts.length > 0 && (
        <Alert
          type="error"
          showIcon
          title="Заважають записи — перенесіть їх або змініть зміну інакше"
          description={<ConflictLinks date={cell.date} records={conflicts} />}
          style={{ marginBottom: 12 }}
        />
      )}

      {row.role === 'master' && (
        <>
          <Divider titlePlacement="start" plain>
            Записи на цей день
          </Divider>
          <DayRecords masterId={row.staffId} date={cell.date} />
        </>
      )}
      {!readOnly && cell.kind !== null && (
        <Popconfirm
          title="Зробити день вихідним?"
          okText="Так"
          cancelText="Ні"
          onConfirm={() => {
            submit({ kind: 'off' });
          }}
        >
          <Button danger type="link" style={{ paddingLeft: 0 }}>
            Прибрати зміну / відмітку
          </Button>
        </Popconfirm>
      )}
    </Modal>
  );
}

/** Записи мастера на день — со ссылками в Розклад. */
function DayRecords({ masterId, date }: { masterId: string; date: string }) {
  const { data = [], isPending } = useQuery(masterDayRecordsQueryOptions(masterId, date));
  if (!isPending && data.length === 0)
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Записів немає" />;
  return (
    <List
      size="small"
      loading={isPending}
      dataSource={[...data].sort((a, b) => a.startAt.localeCompare(b.startAt))}
      renderItem={(r) => (
        <List.Item>
          <Space>
            <Link to="/calendar" search={{ date, recordId: r.id }}>
              {inSalonTz(r.startAt).format('HH:mm')}–{inSalonTz(r.endAt).format('HH:mm')}
            </Link>
            <span>{r.client.name}</span>
            <Typography.Text type="secondary">
              {r.services.map((s) => s.name).join(', ')} · {recordStatusLabels[r.status].text}
            </Typography.Text>
          </Space>
        </List.Item>
      )}
    />
  );
}

export function ConflictLinks({ date, records }: { date: string; records: ConflictRecord[] }) {
  return (
    <Space orientation="vertical" size={0}>
      {records.map((r) => (
        <Link key={r.id} to="/calendar" search={{ date, recordId: r.id }}>
          {inSalonTz(r.startAt).format('HH:mm')}–{inSalonTz(r.endAt).format('HH:mm')} {r.clientName}
        </Link>
      ))}
    </Space>
  );
}
