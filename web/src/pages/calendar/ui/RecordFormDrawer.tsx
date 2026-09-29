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
  serviceCategoryLabel,
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
import { durationMinutes, formatClock, minutesOfDay, toIso } from '../model/time';

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

const phoneRule = (required: boolean) => ({
  validator: (_: unknown, value?: string) =>
    (!required && !value) || (value && isValidPhone(value))
      ? Promise.resolve()
      : Promise.reject(new Error(required ? 'Вкажіть телефон' : 'Невірний формат телефону')),
});

/**
 * «Новий запис» / «Редагувати запис» — широкая панель справа в три колонки (как в старом UI):
 * когда и у кого; что делаем; для кого. Цену и конец записи считает бекенд по услугам.
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
      return {
        masterId: r.master?.id ?? QUEUE,
        date: dayjs(start.format('YYYY-MM-DD')),
        time: dayjs().hour(start.hour()).minute(start.minute()),
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
    const startAt = toIso(date, v.time.hour() * 60 + v.time.minute());
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

  const duration =
    services
      .filter((s) => (serviceIds ?? []).includes(s.id))
      .reduce((acc, s) => acc + s.durationMinutes, 0) || 30;
  const start = time ? time.hour() * 60 + time.minute() : null;
  const busy =
    realMaster && start !== null
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
        <Form.Item name="time" label="Початок" rules={[{ required: true }]} style={{ width: 120 }}>
          <TimePicker format="HH:mm" minuteStep={5} allowClear={false} needConfirm={false} />
        </Form.Item>
      </Space.Compact>
      {start !== null && (
        <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
          До {formatClock(start + duration)} · {duration} хв
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
                    const m = minutesOfDay(s.startAt);
                    form.setFieldValue(
                      'time',
                      dayjs()
                        .hour(Math.floor(m / 60))
                        .minute(m % 60),
                    );
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

  const groups = new Map<string, Service[]>();
  for (const s of services) groups.set(s.category, [...(groups.get(s.category) ?? []), s]);

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
          loading={isPending}
          showSearch={{ optionFilterProp: 'search' }}
          options={[...groups.entries()].map(([category, list]) => ({
            label: serviceCategoryLabel(category),
            title: category,
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
        Послуги виконує один майстер підряд; ціна й тривалість запису — сума послуг.
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
