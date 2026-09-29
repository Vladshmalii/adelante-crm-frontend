import { CalendarOutlined, LeftOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import {
  App,
  Button,
  DatePicker,
  Flex,
  Segmented,
  Space,
  Spin,
  Tag,
  theme,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { useViewer } from '@/shared/auth';
import { QueryErrorAlert } from '@/shared/ui';

import { useUpdateRecord } from '../api/calendar.mutations';
import {
  calendarRecordsQueryOptions,
  dailySummaryQueryOptions,
  scheduleQueryOptions,
} from '../api/calendar.queries';
import { buildColumns, type Column, isWorking } from '../model/columns';
import { type CalendarSearch, type CalendarView, STEPS, type Step } from '../model/search';
import {
  asDay,
  capitalize,
  dateTitle,
  formatClock,
  shiftDate,
  todayInSalon,
  toIso,
  viewRange,
  weekDays,
} from '../model/time';
import { CompleteVisitModal } from './CompleteVisitModal';
import { DayGrid, type MoveTarget } from './DayGrid';
import { MonthView } from './MonthView';
import { PaymentModal } from './PaymentModal';
import { RecordDetailsDrawer } from './RecordDetailsDrawer';
import { RecordFormDrawer, type RecordFormState } from './RecordFormDrawer';
import { WeekGrid } from './WeekGrid';

type RecordItem = Schema<'RecordOut'>;

const route = getRouteApi('/_app/calendar');

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Тиждень' },
  { value: 'month', label: 'Місяць' },
];

/**
 * Розклад: день (колонки мастеров и очередь «Без майстра»), неделя (строки-мастера × дни) и
 * месяц. Мастер видит только свою колонку; очередь, фильтр мастеров и оплата — администратору.
 */
export function CalendarPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const { message, modal } = App.useApp();
  const { can } = useViewer();
  const { token } = theme.useToken();
  const update = useUpdateRecord();

  const date = search.date ?? todayInSalon();
  const [from, to] = viewRange(search.view, date);
  const setSearch = (patch: Partial<CalendarSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const schedule = useQuery(scheduleQueryOptions(from, to));
  const records = useQuery({
    ...calendarRecordsQueryOptions(from, to),
    enabled: search.view !== 'month',
  });
  const summary = useQuery({
    ...dailySummaryQueryOptions(from, to),
    enabled: search.view === 'month',
  });

  const [form, setForm] = useState<RecordFormState | null>(null);
  const [completing, setCompleting] = useState<RecordItem | null>(null);
  const [paying, setPaying] = useState<RecordItem | null>(null);

  // «Додати запис» из меню и Alt+N приходят флагом ?create — форма открыта, пока он стоит.
  const formState: RecordFormState | null =
    form ?? (search.create ? { mode: 'create', date } : null);
  const closeForm = () => {
    setForm(null);
    if (search.create) setSearch({ create: undefined });
  };

  const days = search.view === 'week' ? weekDays(date) : [date];
  const hide = useMemo(() => search.hide ?? [], [search.hide]);
  const allMasters = schedule.data ?? [];
  const columns = useMemo(
    () =>
      buildColumns({
        schedule: allMasters,
        records: records.data ?? [],
        days,
        staff: search.staff,
        hide,
        withQueue: can.records.manageAll,
      }),
    // days — производная от date и view
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allMasters, records.data, date, search.view, search.staff, hide, can.records.manageAll],
  );
  const workingCount = allMasters.filter((m) => isWorking(m, days, records.data ?? [])).length;
  const masterList = allMasters.map((m) => ({ id: m.masterId, name: m.name }));

  const canCreateIn = (c: Column) => c.id !== null || can.records.manageAll;
  // Мастер двигает запись только по времени в своей колонке; в очередь — только администратор.
  const canDrop = (r: RecordItem, c: Column) =>
    can.records.manageAll || c.id === (r.master?.id ?? null);

  const openRecord = (r: RecordItem) => {
    setSearch({ recordId: r.id });
  };

  const confirmMove = (record: RecordItem, target: MoveTarget) => {
    const masterChanged = target.masterId !== (record.master?.id ?? null);
    const master = masterChanged
      ? (allMasters.find((m) => m.masterId === target.masterId)?.name ?? 'Без майстра')
      : null;
    modal.confirm({
      title: 'Перенести запис?',
      content: (
        <>
          {record.client.name}: {asDay(target.date).format('D MMMM')}, {formatClock(target.minutes)}
          {master && (
            <>
              <br />
              Майстер: {master}
            </>
          )}
        </>
      ),
      okText: 'Перенести',
      cancelText: 'Скасувати',
      onOk: () =>
        update
          .mutateAsync({
            id: record.id,
            body: {
              startAt: toIso(target.date, target.minutes),
              ...(masterChanged ? { masterId: target.masterId } : {}),
            },
          })
          .then(
            (saved) => {
              void message.success('Запис перенесено');
              if (saved.outsideShift) void message.warning('Запис поза зміною майстра');
            },
            (e: unknown) => void message.error(errorMessage(e)),
          ),
    });
  };

  const title = dateTitle(date);
  const loading =
    schedule.isPending || (search.view === 'month' ? summary.isPending : records.isPending);
  const error = schedule.error ?? records.error ?? summary.error;

  return (
    <div style={{ padding: '16px 24px' }}>
      {/* Шапка: навигация по датам, дата, вид, новая запись */}
      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 12 }}>
        <Space size="middle">
          <Space.Compact>
            <Button
              aria-label="Назад"
              icon={<LeftOutlined />}
              onClick={() => {
                setSearch({ date: shiftDate(search.view, date, -1) });
              }}
            />
            <Button
              onClick={() => {
                setSearch({ date: undefined });
              }}
            >
              Сьогодні
            </Button>
            <Button
              aria-label="Вперед"
              icon={<RightOutlined />}
              onClick={() => {
                setSearch({ date: shiftDate(search.view, date, 1) });
              }}
            />
          </Space.Compact>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              {search.view === 'month' ? 'Місяць' : title.weekday}
            </Typography.Text>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {search.view === 'month' ? capitalize(asDay(date).format('MMMM YYYY')) : title.full}
            </Typography.Title>
          </div>
          <DatePicker
            aria-label="Обрати дату"
            value={dayjs(date)}
            allowClear={false}
            format="DD.MM.YYYY"
            suffixIcon={<CalendarOutlined />}
            style={{ width: 140 }}
            onChange={(d: dayjs.Dayjs | null) => {
              if (d) setSearch({ date: d.format('YYYY-MM-DD') });
            }}
          />
        </Space>
        <Space>
          <Segmented<CalendarView>
            options={VIEW_OPTIONS}
            value={search.view}
            onChange={(view) => {
              setSearch({ view });
            }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setForm({ mode: 'create', date });
            }}
          >
            Новий запис
          </Button>
        </Space>
      </Flex>

      {/* Фильтры: группа мастеров, шаг сетки, чипы мастеров (мастеру — только шаг) */}
      <Flex wrap gap={12} align="center" style={{ marginBottom: 12 }}>
        {can.records.manageAll && search.view !== 'month' && (
          <Segmented<CalendarSearch['staff']>
            value={search.staff}
            onChange={(staff) => {
              setSearch({ staff });
            }}
            options={[
              { value: 'all', label: 'Усі' },
              {
                value: 'working',
                label: `${search.view === 'day' ? 'Сьогодні' : 'Цього тижня'} (${workingCount})`,
              },
            ]}
          />
        )}
        {search.view === 'day' && (
          <Space size={4}>
            <Typography.Text type="secondary">Крок:</Typography.Text>
            <Segmented<Step>
              size="small"
              value={search.step}
              options={STEPS.map((s) => ({ value: s, label: `${s} хв` }))}
              onChange={(step) => {
                setSearch({ step });
              }}
            />
          </Space>
        )}
        {can.records.manageAll && search.view !== 'month' && allMasters.length > 0 && (
          <Flex wrap gap={4} align="center" style={{ flex: 1, minWidth: 0 }}>
            {allMasters.map((m) => (
              <Tag.CheckableTag
                key={m.masterId}
                checked={!hide.includes(m.masterId)}
                onChange={(checked) => {
                  setSearch({
                    hide: checked ? hide.filter((id) => id !== m.masterId) : [...hide, m.masterId],
                  });
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    marginRight: 4,
                    background: m.color ?? token.colorTextQuaternary,
                  }}
                />
                {m.name}
              </Tag.CheckableTag>
            ))}
            <Button
              size="small"
              type="link"
              onClick={() => {
                setSearch({ hide: undefined });
              }}
            >
              Усіх
            </Button>
            <Button
              size="small"
              type="link"
              onClick={() => {
                setSearch({ hide: allMasters.map((m) => m.masterId) });
              }}
            >
              Очистити
            </Button>
          </Flex>
        )}
      </Flex>

      <QueryErrorAlert
        error={error}
        onRetry={() => {
          void schedule.refetch();
          void records.refetch();
        }}
      />

      {loading ? (
        <Spin style={{ display: 'block', margin: '80px auto' }} />
      ) : search.view === 'day' ? (
        <DayGrid
          date={date}
          columns={columns}
          records={records.data ?? []}
          step={search.step}
          onOpen={openRecord}
          onCreate={(t) => {
            setForm({ mode: 'create', masterId: t.masterId, date: t.date, minutes: t.minutes });
          }}
          onMove={confirmMove}
          canDrop={canDrop}
          canCreateIn={canCreateIn}
        />
      ) : search.view === 'week' ? (
        <WeekGrid
          days={days}
          columns={columns}
          records={records.data ?? []}
          onOpen={openRecord}
          onOpenDay={(d) => {
            setSearch({ view: 'day', date: d });
          }}
          onCreate={(t) => {
            setForm({ mode: 'create', masterId: t.masterId, date: t.date, minutes: t.minutes });
          }}
          onMove={confirmMove}
          canDrop={canDrop}
          canCreateIn={canCreateIn}
        />
      ) : (
        <MonthView
          date={date}
          summary={summary.data ?? []}
          masters={new Map(allMasters.map((m) => [m.masterId, { name: m.name, color: m.color }]))}
          onOpenDay={(d) => {
            setSearch({ view: 'day', date: d });
          }}
          onOpen={openRecord}
        />
      )}

      <RecordFormDrawer
        state={formState}
        masters={masterList}
        onClose={closeForm}
        onSaved={closeForm}
      />
      <RecordDetailsDrawer
        recordId={search.recordId}
        onClose={() => {
          setSearch({ recordId: undefined });
        }}
        onEdit={(r) => {
          setForm({ mode: 'edit', record: r });
        }}
        onComplete={setCompleting}
        onPay={setPaying}
      />
      <CompleteVisitModal
        record={completing}
        onClose={() => {
          setCompleting(null);
        }}
      />
      <PaymentModal
        record={paying}
        onClose={() => {
          setPaying(null);
        }}
      />
    </div>
  );
}
