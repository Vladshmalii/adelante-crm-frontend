import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { theme, Typography } from 'antd';
import {
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { Schema } from '@/shared/api';
import { shiftMarkLabels } from '@/shared/lib';

import { type Column, columnKey, isMovable, recordsOf } from '../model/columns';
import {
  type Interval,
  offHours,
  placeOverlapping,
  shortBreaks,
  snapMove,
  visibleHours,
} from '../model/layout';
import type { Step } from '../model/search';
import {
  durationMinutes,
  formatClock,
  minutesOfDay,
  parseClock,
  todayInSalon,
} from '../model/time';
import { RecordCard } from './RecordCard';
import { useResize } from './use-resize';

type RecordItem = Schema<'RecordOut'>;

/** Высота часа в пикселях по шагу сетки: мельче шаг — крупнее сетка. */
const HOUR_PX: Record<Step, number> = { 5: 240, 15: 144, 30: 96, 60: 64 };
const TIME_AXIS = 56;
const HEADER = 52;

export interface MoveTarget {
  masterId: string | null;
  date: string;
  minutes: number;
}

interface DayGridProps {
  date: string;
  columns: Column[];
  records: RecordItem[];
  step: Step;
  onOpen: (record: RecordItem) => void;
  onCreate: (target: MoveTarget) => void;
  onMove: (record: RecordItem, target: MoveTarget) => void;
  /** Новое время записи после растягивания за край (минуты от полуночи того же дня). */
  onResize: (record: RecordItem, interval: Interval) => void;
  /** Можно ли растягивать запись (мастер — только свои). */
  canResize: (record: RecordItem) => boolean;
  /** Можно ли тащить запись в эту колонку (мастер — только в свою). */
  canDrop: (record: RecordItem, column: Column) => boolean;
  /** Можно ли создать запись кликом в колонке (очередь — только администратору). */
  canCreateIn: (column: Column) => boolean;
}

const windowsOf = (column: Column, date: string): Interval[] =>
  (column.schedule?.days.find((d) => d.date === date)?.windows ?? []).map((w) => ({
    start: parseClock(w.start),
    end: parseClock(w.end),
  }));

/** Подпись под именем мастера: часы работы, причина отсутствия или «не працює». */
function workLabel(column: Column, date: string): string | null {
  if (!column.schedule) return 'Черга';
  const day = column.schedule.days.find((d) => d.date === date);
  if (!day) return null;
  // Отметки графика — відпустка і лікарняний; выходной — просто нет смены.
  if (day.exception && day.exception.type !== 'shift')
    return shiftMarkLabels[day.exception.type].text;
  if (!day.isWorkDay || !day.windows.length) return 'Не працює';
  const first = day.windows[0];
  const last = day.windows[day.windows.length - 1];
  return first && last ? `${first.start.slice(0, 5)}–${last.end.slice(0, 5)}` : null;
}

export function DayGrid(props: DayGridProps) {
  const { date, columns, records, step, onMove } = props;
  const { token } = theme.useToken();
  const scrollRef = useRef<HTMLDivElement>(null);
  const ppm = HOUR_PX[step] / 60;
  const isToday = date === todayInSalon();
  const now = useNowMinutes(isToday);

  // Видимые часы: 08–20, шире — если есть записи или смены за пределами.
  const hours = useMemo(() => {
    const spans: Interval[] = records.map((r) => ({
      start: minutesOfDay(r.startAt),
      end: minutesOfDay(r.startAt) + durationMinutes(r.startAt, r.endAt),
    }));
    for (const c of columns) spans.push(...windowsOf(c, date));
    return visibleHours(spans);
  }, [records, columns, date]);
  const height = (hours.end - hours.start) * ppm;

  // При открытии дня — прокрутка к текущему часу (сегодня) или к началу работы.
  useEffect(() => {
    const target = isToday && now !== null ? now - 60 : 9 * 60;
    scrollRef.current?.scrollTo({ top: Math.max(0, (target - hours.start) * ppm) });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- только при смене дня и шага
  }, [date, step]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = ({ active, over, delta }: DragEndEvent) => {
    const record = (active.data.current as { record?: RecordItem } | undefined)?.record;
    if (!record) return;
    const target = (over?.data.current as { column?: Column } | undefined)?.column;
    const column = target ?? columns.find((c) => c.id === (record.master?.id ?? null));
    if (!column || !props.canDrop(record, column)) return;
    const minutes = snapMove(minutesOfDay(record.startAt), delta.y, ppm, step);
    const sameColumn = column.id === (record.master?.id ?? null);
    if (sameColumn && minutes === minutesOfDay(record.startAt)) return;
    onMove(record, { masterId: column.id, date, minutes });
  };

  const hourMarks = [];
  for (let m = Math.ceil(hours.start / 60) * 60; m < hours.end; m += 60) hourMarks.push(m);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd} autoScroll>
      <div
        ref={scrollRef}
        style={{
          overflow: 'auto',
          height: 'calc(100vh - 260px)',
          minHeight: 420,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadiusLG,
          background: token.colorBgContainer,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${TIME_AXIS}px repeat(${columns.length}, minmax(180px, 1fr))`,
            gridTemplateRows: `${HEADER}px ${height}px`,
            minWidth: TIME_AXIS + columns.length * 180,
          }}
        >
          {/* Шапка: угол и имена колонок — прилипают при прокрутке */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              left: 0,
              zIndex: 4,
              background: token.colorBgContainer,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
            }}
          />
          {columns.map((c) => (
            <div
              key={columnKey(c.id)}
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 3,
                background: token.colorBgContainer,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                borderLeft: `1px solid ${token.colorBorderSecondary}`,
                padding: '6px 10px',
                overflow: 'hidden',
              }}
            >
              <Typography.Text strong ellipsis style={{ display: 'block' }}>
                {c.color && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background: c.color,
                      marginRight: 6,
                    }}
                  />
                )}
                {c.name}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                {workLabel(c, date)}
              </Typography.Text>
            </div>
          ))}

          {/* Шкала времени */}
          <div
            style={{
              position: 'sticky',
              left: 0,
              zIndex: 2,
              background: token.colorBgContainer,
              height,
            }}
          >
            {/* Метку часа рядом с «ЗАРАЗ» прячем, чтобы подписи не наезжали. */}
            {hourMarks
              .filter((m) => !(isToday && now !== null && Math.abs(m - now) < 12))
              .map((m) => (
                <div
                  key={m}
                  style={{
                    position: 'absolute',
                    top: (m - hours.start) * ppm - 8,
                    right: 8,
                    fontSize: token.fontSizeSM,
                    color: token.colorTextSecondary,
                  }}
                >
                  {formatClock(m)}
                </div>
              ))}
            {isToday && now !== null && now >= hours.start && now <= hours.end && (
              <div
                style={{
                  position: 'absolute',
                  top: (now - hours.start) * ppm - 9,
                  right: 2,
                  fontSize: 10,
                  fontWeight: 600,
                  color: token.colorError,
                }}
              >
                ЗАРАЗ
              </div>
            )}
          </div>

          {columns.map((c) => (
            <DayColumn
              key={columnKey(c.id)}
              {...props}
              column={c}
              hours={hours}
              ppm={ppm}
              now={isToday ? now : null}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}

interface DayColumnProps extends DayGridProps {
  column: Column;
  hours: Interval;
  ppm: number;
  now: number | null;
}

function DayColumn({
  column,
  date,
  records,
  step,
  hours,
  ppm,
  now,
  onOpen,
  onCreate,
  onResize,
  canResize,
  canCreateIn,
}: DayColumnProps) {
  const { token } = theme.useToken();
  const { setNodeRef, isOver } = useDroppable({ id: columnKey(column.id), data: { column } });
  const own = recordsOf(records, column);
  const spans = own.map((r) => {
    const start = minutesOfDay(r.startAt);
    return { start, end: start + durationMinutes(r.startAt, r.endAt), item: r };
  });
  const placed = placeOverlapping(spans);
  const breaks = shortBreaks(spans);
  const off = column.schedule ? offHours(windowsOf(column, date), hours.start, hours.end) : [];
  const stepPx = step * ppm;
  const top = (m: number) => (m - hours.start) * ppm;

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-card]')) return;
    if (!canCreateIn(column)) return;
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
    const minutes = hours.start + Math.floor(y / ppm / step) * step;
    onCreate({ masterId: column.id, date, minutes });
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      style={{
        position: 'relative',
        borderLeft: `1px solid ${token.colorBorderSecondary}`,
        cursor: canCreateIn(column) ? 'cell' : 'default',
        backgroundColor: isOver ? token.colorPrimaryBgHover : undefined,
        // Линии шага; у очереди «Без майстра» — ещё и штриховка. Видимые часы начинаются с
        // целого часа, поэтому линии совпадают с шагом без сдвига.
        backgroundImage: [
          `repeating-linear-gradient(to bottom, ${token.colorBorderSecondary} 0 1px, transparent 1px ${stepPx}px)`,
          column.id === null
            ? `repeating-linear-gradient(45deg, transparent 0 8px, ${token.colorFillQuaternary} 8px 16px)`
            : null,
        ]
          .filter(Boolean)
          .join(', '),
      }}
    >
      {off.map((o) => (
        <div
          key={o.start}
          style={{
            position: 'absolute',
            top: top(o.start),
            height: (o.end - o.start) * ppm,
            left: 0,
            right: 0,
            background: token.colorFillTertiary,
            pointerEvents: 'none',
          }}
        />
      ))}
      {breaks.map((b) => (
        <div
          key={`break-${b.start}`}
          style={{
            position: 'absolute',
            top: top(b.start),
            height: Math.max((b.end - b.start) * ppm, 12),
            left: 4,
            right: 4,
            fontSize: 10,
            color: token.colorTextTertiary,
            textAlign: 'center',
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          Перерва
        </div>
      ))}
      {placed.map((p) => (
        <DraggableCard
          key={p.item.id}
          record={p.item}
          span={{ start: p.start, end: p.end }}
          origin={hours.start}
          ppm={ppm}
          step={step}
          left={`calc(${(p.lane / p.lanes) * 100}% + 2px)`}
          width={`calc(${100 / p.lanes}% - 4px)`}
          onOpen={onOpen}
          resizable={canResize(p.item)}
          onResize={onResize}
        />
      ))}
      {now !== null && now >= hours.start && now <= hours.end && (
        <div
          style={{
            position: 'absolute',
            top: top(now),
            left: 0,
            right: 0,
            height: 2,
            background: token.colorError,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

function DraggableCard({
  record,
  span,
  origin,
  ppm,
  step,
  left,
  width,
  onOpen,
  resizable,
  onResize,
}: {
  record: RecordItem;
  /** Интервал записи и начало видимой сетки — минуты от полуночи. */
  span: Interval;
  origin: number;
  ppm: number;
  step: Step;
  left: string;
  width: string;
  onOpen: (record: RecordItem) => void;
  resizable: boolean;
  onResize: (record: RecordItem, interval: Interval) => void;
}) {
  const { token } = theme.useToken();
  const { preview, begin } = useResize({
    interval: span,
    pxPerMinute: ppm,
    step,
    onCommit: (next) => {
      onResize(record, next);
    },
  });
  const shown = preview ?? span;
  const top = (shown.start - origin) * ppm;
  const height = Math.max((shown.end - shown.start) * ppm, 22);
  const movable = isMovable(record);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: record.id,
    data: { record },
    disabled: !movable,
  });

  return (
    <div
      ref={setNodeRef}
      data-card
      {...listeners}
      {...attributes}
      role={undefined}
      style={{
        position: 'absolute',
        top,
        height,
        left,
        width,
        zIndex: isDragging || preview ? 10 : 2,
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        cursor: movable ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
        opacity: isDragging ? 0.85 : 1,
        boxShadow: preview ? `0 0 0 2px ${token.colorPrimary}` : undefined,
        borderRadius: token.borderRadius,
      }}
    >
      {resizable && (
        <>
          <ResizeHandle edge="start" onPointerDown={begin('start')} />
          <ResizeHandle edge="end" onPointerDown={begin('end')} />
        </>
      )}
      {preview && (
        <div
          style={{
            position: 'absolute',
            top: -22,
            left: 0,
            zIndex: 1,
            padding: '0 6px',
            borderRadius: token.borderRadiusSM,
            background: token.colorPrimary,
            color: '#fff',
            fontSize: token.fontSizeSM,
            lineHeight: '20px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {formatClock(preview.start)}–{formatClock(preview.end)} · {preview.end - preview.start} хв
        </div>
      )}
      <RecordCard
        record={record}
        size={height < 40 ? 'small' : height < 72 ? 'medium' : 'large'}
        style={{ height: '100%' }}
        onClick={() => {
          onOpen(record);
        }}
      />
    </div>
  );
}

/** Невидимая полоска у края карточки: тянуть — менять начало или конец записи. */
function ResizeHandle({
  edge,
  onPointerDown,
}: {
  edge: 'start' | 'end';
  onPointerDown: (e: ReactPointerEvent) => void;
}) {
  return (
    <div
      aria-hidden
      onPointerDown={onPointerDown}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: 6,
        ...(edge === 'start' ? { top: -2 } : { bottom: -2 }),
        zIndex: 2,
        cursor: 'ns-resize',
        touchAction: 'none',
      }}
    />
  );
}

/** Текущее время салона в минутах; обновляется раз в минуту (линия «ЗАРАЗ»). */
function useNowMinutes(enabled: boolean): number | null {
  const [now, setNow] = useState(() => minutesOfDay(new Date().toISOString()));
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => {
      setNow(minutesOfDay(new Date().toISOString()));
    }, 60_000);
    return () => {
      clearInterval(timer);
    };
  }, [enabled]);
  return enabled ? now : null;
}
