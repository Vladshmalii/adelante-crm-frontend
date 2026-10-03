import { SearchOutlined } from '@ant-design/icons';
import { DrawerForm } from '@ant-design/pro-components';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Checkbox,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  Input,
  Radio,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Tag,
  TimePicker,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { useViewer } from '@/shared/auth';
import {
  formatDateTime,
  formatMoney,
  formatPhone,
  importanceLabels,
  inSalonTz,
  isValidPhone,
  sourceLabels,
  useDebouncedValue,
} from '@/shared/lib';
import { PhoneInput } from '@/shared/ui';

import { useCreateRecord, useUpdateRecord } from '../api/calendar.mutations';
import {
  activeServicesQueryOptions,
  calendarRecordsQueryOptions,
  clientCardQueryOptions,
  clientSearchQueryOptions,
  slotsQueryOptions,
} from '../api/calendar.queries';
import { overlapsAny } from '../model/layout';
import { durationMinutes, minutesOfDay, toIso } from '../model/time';

type RecordItem = Schema<'RecordOut'>;
type Service = Schema<'app__api__admin__services__ServiceOut'>;

/** Значение «Без майстра» в выборе мастера (в API — `masterId: null`). */
const QUEUE = '__queue__';

export type RecordFormState =
  | { mode: 'create'; masterId?: string | null; date: string; minutes?: number }
  | { mode: 'edit'; record: RecordItem };

interface FormValues {
  masterId: string;
  date: Dayjs;
  time: Dayjs;
  endTime?: Dayjs;
  serviceIds: string[];
  importance: Schema<'RecordImportance'>;
  source: Schema<'RecordSource'>;
  comment?: string;
  internalNotes?: string;
  reminderEnabled: boolean;
  clientMode: 'search' | 'new';
  clientId?: string;
  newClientName?: string;
  newClientPhone?: string;
  forOther: boolean;
  visitorName?: string;
  visitorPhone?: string;
}

interface RecordFormDrawerProps {
  state: RecordFormState | null;
  masters: { id: string; name: string }[];
  onClose: () => void;
  onSaved: (record: RecordItem) => void;
}

const blank = (v: string | undefined) => (v?.trim() ? v.trim() : null);

/** Минуты от полуночи ↔ значение TimePicker. */
const clockOf = (t: Dayjs) => t.hour() * 60 + t.minute();
const pickerTime = (minutes: number) =>
  dayjs()
    .hour(Math.floor(minutes / 60) % 24)
    .minute(minutes % 60);
/** Конец записи: 00:00 — это полночь в конце дня, а не его начало. */
const endOf = (t: Dayjs) => clockOf(t) || 24 * 60;
const DAY_END = 24 * 60;

const phoneRule = (required: boolean) => ({
  validator: (_: unknown, value?: string) =>
    (!required && !value) || (value && isValidPhone(value))
      ? Promise.resolve()
      : Promise.reject(new Error(required ? 'Вкажіть телефон' : 'Невірний формат телефону')),
});

/**
 * «Новий запис» / «Редагувати запис» — широкая панель справа в три колонки (как в старом UI):
 * когда и у кого; что делаем; для кого. Цену считает бекенд по услугам. Конец по умолчанию —
 * начало плюс длительность услуг: пересчитывается при смене услуг, сдвигается вместе с началом,
 * а вручную его можно поставить любым.
 */
export function RecordFormDrawer(props: RecordFormDrawerProps) {
  // Форма создаётся заново на каждое открытие: initialValues antd берёт только при создании.
  if (!props.state) return null;
  const key =
    props.state.mode === 'edit'
      ? `edit-${props.state.record.id}`
      : `create-${props.state.masterId ?? ''}-${props.state.date}-${props.state.minutes ?? ''}`;
  return <RecordForm key={key} {...props} state={props.state} />;
}

function RecordForm({
  state,
  masters,
  onClose,
  onSaved,
}: RecordFormDrawerProps & { state: RecordFormState }) {
  const { message } = App.useApp();
  const { viewer, can } = useViewer();
  const [form] = Form.useForm<FormValues>();
  const create = useCreateRecord();
  const update = useUpdateRecord();
  const editing = state.mode === 'edit' ? state.record : null;

  const initialValues = useMemo<Partial<FormValues>>(() => {
    if (state.mode === 'edit') {
      const r = state.record;
      const start = inSalonTz(r.startAt);
      const end = inSalonTz(r.endAt);
      return {
        masterId: r.master?.id ?? QUEUE,
        date: dayjs(start.format('YYYY-MM-DD')),
        time: dayjs().hour(start.hour()).minute(start.minute()),
        endTime: dayjs().hour(end.hour()).minute(end.minute()),
        serviceIds: r.services.map((s) => s.id),
        importance: r.importance,
        comment: r.comment ?? undefined,
        reminderEnabled: r.reminderEnabled,
        forOther: !!(r.visitorName ?? r.visitorPhone),
        visitorName: r.visitorName ?? undefined,
        visitorPhone: r.visitorPhone ?? undefined,
      };
    }
    const minutes = state.minutes ?? 10 * 60;
    return {
      // Мастер записывает только к себе; администратор без выбора — в очередь.
      masterId: viewer.isMaster ? viewer.id : (state.masterId ?? QUEUE),
      date: dayjs(state.date),
      time: dayjs()
        .hour(Math.floor(minutes / 60))
        .minute(minutes % 60),
      serviceIds: [],
      importance: 'standard',
      source: 'admin',
      reminderEnabled: true,
      clientMode: 'search',
      forOther: false,
    };
  }, [state, viewer]);

  const submit = async (v: FormValues) => {
    const date = v.date.format('YYYY-MM-DD');
    const startAt = toIso(date, clockOf(v.time));
    const endAt = v.endTime ? toIso(date, endOf(v.endTime)) : undefined;
    const masterId = v.masterId === QUEUE ? null : v.masterId;
    const visitor = v.forOther
      ? { visitorName: blank(v.visitorName), visitorPhone: blank(v.visitorPhone) }
      : { visitorName: null, visitorPhone: null };
    try {
      let saved: RecordItem;
      if (editing) {
        saved = await update.mutateAsync({
          id: editing.id,
          body: {
            startAt,
            endAt,
            serviceIds: v.serviceIds,
            importance: v.importance,
            comment: blank(v.comment),
            internalNotes: blank(v.internalNotes),
            reminderEnabled: v.reminderEnabled,
            ...visitor,
            // Смену мастера бекенд разрешает только администратору.
            ...(can.records.manageAll ? { masterId } : {}),
          },
        });
      } else {
        saved = await create.mutateAsync({
          masterId: viewer.isMaster ? viewer.id : masterId,
          serviceIds: v.serviceIds,
          startAt,
          endAt,
          importance: v.importance,
          source: v.source,
          comment: blank(v.comment),
          reminderEnabled: v.reminderEnabled,
          ...visitor,
          ...(v.clientMode === 'new'
            ? { newClient: { name: (v.newClientName ?? '').trim(), phone: v.newClientPhone ?? '' } }
            : { clientId: v.clientId }),
        });
      }
      message.success(editing ? 'Запис оновлено' : 'Запис створено');
      if (saved.outsideShift) message.warning('Запис поза зміною майстра');
      onSaved(saved);
      return true;
    } catch (error) {
      message.error(errorMessage(error));
      return false;
    }
  };

  return (
    <DrawerForm<FormValues>
      title={editing ? `Редагувати запис: ${editing.client.name}` : 'Новий запис'}
      open
      form={form}
      width="min(1180px, 96vw)"
      drawerProps={{ destroyOnHidden: true, onClose }}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      initialValues={initialValues}
      dateFormatter={false}
      submitter={{ searchConfig: { submitText: 'Зберегти запис', resetText: 'Скасувати' } }}
      onFinish={submit}
    >
      <Row gutter={24}>
        <Col span={8}>
          <WhenBlock form={form} editing={editing} masters={masters} />
        </Col>
        <Col span={8}>
          <ServicesBlock form={form} />
        </Col>
        <Col span={8}>
          {editing ? <EditClientBlock record={editing} /> : <ClientBlock form={form} />}
        </Col>
      </Row>
    </DrawerForm>
  );
}

/** Левая колонка: мастер, дата, время, проверка занятости, рівень, комментарий. */
function WhenBlock({
  form,
  editing,
  masters,
}: {
  form: ReturnType<typeof Form.useForm<FormValues>>[0];
  editing: RecordItem | null;
  masters: { id: string; name: string }[];
}) {
  const { viewer, can } = useViewer();
  const queryClient = useQueryClient();
  // До инициализации формы значения ещё не заданы.
  const masterId = Form.useWatch('masterId', form) as string | undefined;
  const date = Form.useWatch('date', form) as Dayjs | undefined;
  const time = Form.useWatch('time', form) as Dayjs | undefined;
  const endTime = Form.useWatch('endTime', form);
  const serviceIds = Form.useWatch('serviceIds', form) as string[] | undefined;
  const { data: services = [] } = useQuery(activeServicesQueryOptions());
  const [slots, setSlots] = useState<{ startAt: string; label: string }[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const day = date?.format('YYYY-MM-DD');
  const realMaster = masterId && masterId !== QUEUE ? masterId : null;
  const { data: dayRecords = [] } = useQuery({
    ...calendarRecordsQueryOptions(day ?? '', day ?? ''),
    enabled: !!day && !!realMaster,
  });

  const servicesMinutes = services
    .filter((s) => (serviceIds ?? []).includes(s.id))
    .reduce((acc, s) => acc + s.durationMinutes, 0);
  const start = time ? clockOf(time) : null;
  const end = endTime ? endOf(endTime) : null;
  const duration = start !== null && end !== null && end > start ? end - start : null;

  /**
   * Начало сменилось — конец сдвигается вместе с ним. `duration` здесь ещё из прошлого рендера,
   * то есть длительность до изменения.
   */
  const shiftEnd = (nextStart: number) => {
    const length = duration ?? servicesMinutes;
    if (length) form.setFieldValue('endTime', pickerTime(Math.min(nextStart + length, DAY_END)));
  };

  const busy =
    realMaster && start !== null && duration !== null
      ? overlapsAny(
          { start, end: start + duration },
          dayRecords
            .filter(
              (r) =>
                r.master?.id === realMaster && r.status !== 'cancelled' && r.id !== editing?.id,
            )
            .map((r) => {
              const s = minutesOfDay(r.startAt);
              return { start: s, end: s + durationMinutes(r.startAt, r.endAt) };
            }),
        )
      : false;

  const findSlots = async () => {
    if (!realMaster || !day || !serviceIds?.length) return;
    setSlotsLoading(true);
    try {
      setSlots(await queryClient.query(slotsQueryOptions(realMaster, day, serviceIds)));
    } finally {
      setSlotsLoading(false);
    }
  };

  const masterOptions = [
    ...(can.records.manageAll ? [{ value: QUEUE, label: 'Без майстра (черга)' }] : []),
    ...masters.map((m) => ({ value: m.id, label: m.name })),
  ];

  return (
    <>
      <Form.Item name="masterId" label="Майстер" rules={[{ required: true }]}>
        <Select
          showSearch={{ optionFilterProp: 'label' }}
          options={masterOptions}
          disabled={viewer.isMaster || (!!editing && !can.records.manageAll)}
          onChange={() => {
            setSlots(null);
          }}
        />
      </Form.Item>
      <Space.Compact style={{ width: '100%' }}>
        <Form.Item name="date" label="Дата" rules={[{ required: true }]} style={{ flex: 1 }}>
          <DatePicker
            format="DD.MM.YYYY"
            allowClear={false}
            style={{ width: '100%' }}
            onChange={() => {
              setSlots(null);
            }}
          />
        </Form.Item>
        <Form.Item
          name="time"
          label="Початок"
          rules={[{ required: true, message: 'Вкажіть початок' }]}
          style={{ width: 100 }}
        >
          <TimePicker
            format="HH:mm"
            minuteStep={5}
            allowClear={false}
            needConfirm={false}
            onChange={(value) => {
              if (value) shiftEnd(clockOf(value));
            }}
          />
        </Form.Item>
        <Form.Item
          name="endTime"
          label="Кінець"
          dependencies={['time']}
          style={{ width: 100 }}
          rules={[
            { required: true, message: 'Вкажіть кінець' },
            {
              validator: (_, value?: Dayjs) =>
                !value || start === null || endOf(value) > start
                  ? Promise.resolve()
                  : Promise.reject(new Error('Кінець пізніше за початок')),
            },
          ]}
        >
          <TimePicker format="HH:mm" minuteStep={5} allowClear={false} needConfirm={false} />
        </Form.Item>
      </Space.Compact>
      {duration !== null && (
        <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
          {duration} хв
          {servicesMinutes > 0 && servicesMinutes !== duration && (
            <>
              {' '}
              · за послугами {servicesMinutes} хв{' '}
              <Typography.Link
                onClick={() => {
                  if (start !== null)
                    form.setFieldValue(
                      'endTime',
                      pickerTime(Math.min(start + servicesMinutes, DAY_END)),
                    );
                }}
              >
                повернути
              </Typography.Link>
            </>
          )}
        </Typography.Paragraph>
      )}
      {busy && (
        <Alert
          type="warning"
          showIcon
          title="Цей час вже зайнятий майстром"
          style={{ marginBottom: 12 }}
        />
      )}
      {realMaster && (
        <Button
          icon={<SearchOutlined />}
          loading={slotsLoading}
          disabled={!serviceIds?.length}
          onClick={() => void findSlots()}
          style={{ marginBottom: 12 }}
        >
          Знайти вільний час
        </Button>
      )}
      {slots && (
        <div style={{ marginBottom: 12 }}>
          {slots.length ? (
            <Space size={[4, 4]} wrap>
              {slots.map((s) => (
                <Tag.CheckableTag
                  key={s.startAt}
                  checked={start === minutesOfDay(s.startAt)}
                  onChange={() => {
                    // Свободное окно подобрано под длительность услуг.
                    const m = minutesOfDay(s.startAt);
                    form.setFieldsValue({
                      time: pickerTime(m),
                      endTime: pickerTime(Math.min(m + servicesMinutes, DAY_END)),
                    });
                  }}
                >
                  {s.label}
                </Tag.CheckableTag>
              ))}
            </Space>
          ) : (
            <Typography.Text type="secondary">Вільного часу на цей день немає</Typography.Text>
          )}
        </div>
      )}
      <Form.Item name="importance" label="Рівень">
        <Radio.Group
          optionType="button"
          options={Object.entries(importanceLabels).map(([value, { text }]) => ({
            value,
            label: text,
          }))}
        />
      </Form.Item>
      {!editing && (
        <Form.Item name="source" label="Джерело">
          <Select
            options={(['admin', 'phone', 'walk_in'] as const).map((value) => ({
              value,
              label: sourceLabels[value],
            }))}
          />
        </Form.Item>
      )}
      <Form.Item name="comment" label="Коментар до запису">
        <Input.TextArea rows={3} placeholder="Особливі побажання, алергії…" maxLength={2000} />
      </Form.Item>
      {editing && (
        <Form.Item name="internalNotes" label="Нотатки" tooltip="Видно лише співробітникам">
          <Input.TextArea rows={2} maxLength={2000} />
        </Form.Item>
      )}
      <Form.Item
        name="reminderEnabled"
        label="Нагадування клієнту в Telegram за 30 хв"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
    </>
  );
}

/** Средняя колонка: услуги по категориям, итог по цене и длительности. */
function ServicesBlock({ form }: { form: ReturnType<typeof Form.useForm<FormValues>>[0] }) {
  const { data: services = [], isPending } = useQuery(activeServicesQueryOptions());
  const serviceIds = Form.useWatch('serviceIds', form) as string[] | undefined;
  const chosen = services.filter((s) => (serviceIds ?? []).includes(s.id));

  const groups = new Map<string, { name: string; list: Service[] }>();
  for (const s of services) {
    const group = groups.get(s.category.id) ?? { name: s.category.name, list: [] };
    group.list.push(s);
    groups.set(s.category.id, group);
  }

  return (
    <>
      <Form.Item
        name="serviceIds"
        label="Послуги"
        rules={[{ required: true, type: 'array', min: 1, message: 'Оберіть хоча б одну послугу' }]}
      >
        <Select
          mode="multiple"
          placeholder="Що будемо робити?"
          onChange={(ids: string[]) => {
            // Состав услуг сменился — конец снова по их длительности.
            const minutes = services
              .filter((s) => ids.includes(s.id))
              .reduce((acc, s) => acc + s.durationMinutes, 0);
            const time = form.getFieldValue('time') as Dayjs | undefined;
            if (time && minutes)
              form.setFieldValue('endTime', pickerTime(Math.min(clockOf(time) + minutes, DAY_END)));
          }}
          loading={isPending}
          showSearch={{ optionFilterProp: 'search' }}
          options={[...groups.entries()].map(([id, { name, list }]) => ({
            label: name,
            title: id,
            options: list.map((s) => ({
              value: s.id,
              search: s.name,
              label: `${s.name} · ${s.durationMinutes} хв · ${formatMoney(s.price)}`,
            })),
          }))}
        />
      </Form.Item>
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title="Ціна"
            value={formatMoney(chosen.reduce((acc, s) => acc + Number(s.price), 0))}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Тривалість"
            value={chosen.reduce((acc, s) => acc + s.durationMinutes, 0)}
            suffix="хв"
          />
        </Col>
      </Row>
      <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
        Послуги виконує один майстер підряд; ціна — сума послуг. Тривалість за замовчуванням — сума
        послуг, кінець можна змінити вручну.
      </Typography.Paragraph>
    </>
  );
}

/** Правая колонка при создании: найти клиента или завести нового; «Записую іншу людину». */
function ClientBlock({ form }: { form: ReturnType<typeof Form.useForm<FormValues>>[0] }) {
  const mode = Form.useWatch('clientMode', form);
  const clientId = Form.useWatch('clientId', form);
  const forOther = Form.useWatch('forOther', form);
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const { data: found = [], isFetching } = useQuery(clientSearchQueryOptions(debounced));

  return (
    <>
      <Form.Item name="clientMode">
        <Radio.Group
          optionType="button"
          options={[
            { value: 'search', label: 'Знайти клієнта' },
            { value: 'new', label: 'Новий клієнт' },
          ]}
        />
      </Form.Item>
      {mode === 'new' ? (
        <>
          <Form.Item
            name="newClientName"
            label="Ім'я клієнта"
            rules={[{ required: true, whitespace: true, message: "Вкажіть ім'я" }]}
          >
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item
            name="newClientPhone"
            label="Телефон"
            required
            rules={[phoneRule(true)]}
            tooltip="Якщо клієнт з таким телефоном уже є — запис буде до нього"
          >
            <PhoneInput />
          </Form.Item>
        </>
      ) : (
        <>
          <Form.Item
            name="clientId"
            label="Клієнт"
            rules={[{ required: true, message: 'Оберіть клієнта або створіть нового' }]}
          >
            <Select
              placeholder="Ім'я або телефон (від 3 символів)"
              showSearch={{ filterOption: false, onSearch: setQuery }}
              loading={isFetching}
              notFoundContent={
                debounced.trim().length < 3
                  ? 'Введіть щонайменше 3 символи'
                  : isFetching
                    ? 'Шукаємо…'
                    : 'Не знайдено — створіть нового'
              }
              options={found.map((c) => ({
                value: c.id,
                label: `${[c.lastName, c.firstName].filter(Boolean).join(' ')} · ${formatPhone(c.phone)}`,
              }))}
            />
          </Form.Item>
          {clientId && <ClientSummary id={clientId} />}
        </>
      )}
      <Divider />
      <Form.Item name="forOther" valuePropName="checked">
        <Checkbox>Записую іншу людину</Checkbox>
      </Form.Item>
      {forOther && <VisitorFields />}
    </>
  );
}

function VisitorFields() {
  return (
    <>
      <Form.Item name="visitorName" label="Ім'я того, хто прийде">
        <Input maxLength={255} />
      </Form.Item>
      <Form.Item name="visitorPhone" label="Його телефон" rules={[phoneRule(false)]}>
        <PhoneInput />
      </Form.Item>
    </>
  );
}

/** Правая колонка при редактировании: клиента записи сменить нельзя, гостя — можно. */
function EditClientBlock({ record }: { record: RecordItem }) {
  const forOther = Form.useWatch<boolean>('forOther');
  return (
    <>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        {record.client.name}
      </Typography.Title>
      <Typography.Text type="secondary">{formatPhone(record.client.phone)}</Typography.Text>
      <ClientSummary id={record.client.id} />
      <Divider />
      <Form.Item name="forOther" valuePropName="checked">
        <Checkbox>Записую іншу людину</Checkbox>
      </Form.Item>
      {forOther && <VisitorFields />}
    </>
  );
}

function ClientSummary({ id }: { id: string }) {
  const { data: client } = useQuery(clientCardQueryOptions(id));
  if (!client) return null;
  return (
    <Descriptions
      size="small"
      column={1}
      style={{ marginTop: 8 }}
      items={[
        { label: 'Візитів', children: client.totalVisits },
        { label: 'Останній візит', children: formatDateTime(client.lastVisit) },
        {
          label: 'Telegram',
          children: client.telegramLinked ? (
            <Tag color="green">Підключено</Tag>
          ) : (
            <Typography.Text type="secondary">Не підключено</Typography.Text>
          ),
        },
      ]}
    />
  );
}
