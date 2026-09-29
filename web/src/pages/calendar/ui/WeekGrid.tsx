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
import type { MouseEvent } from 'react';

import type { Schema } from '@/shared/api';

import { type Column, columnKey, isMovable, recordsOf } from '../model/columns';
import { asDay, capitalize, dayOf, minutesOfDay, parseClock, todayInSalon } from '../model/time';
import type { MoveTarget } from './DayGrid';
import { RecordCard } from './RecordCard';

type RecordItem = Schema<'RecordOut'>;

interface WeekGridProps {
  days: string[];
  columns: Column[];
  records: RecordItem[];
  onOpen: (record: RecordItem) => void;
  onOpenDay: (date: string) => void;
  onCreate: (target: MoveTarget) => void;
  onMove: (record: RecordItem, target: MoveTarget) => void;
  canDrop: (record: RecordItem, column: Column) => boolean;
  canCreateIn: (column: Column) => boolean;
}

const NAME_COL = 200;

/** Неделя: строки — мастера и очередь, столбцы — дни; в ячейке — карточки записей дня. */
export function WeekGrid(props: WeekGridProps) {
  const { days, columns, records, onMove, onOpenDay } = props;
  const { token } = theme.useToken();
  const today = todayInSalon();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Перенос в другой день или к другому мастеру; время начала сохраняется.
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const record = (active.data.current as { record?: RecordItem } | undefined)?.record;
    const target = over?.data.current as { column?: Column; date?: string } | undefined;
    if (!record || !target?.column || !target.date) return;
    if (!props.canDrop(record, target.column)) return;
    const same =
      target.column.id === (record.master?.id ?? null) && target.date === dayOf(record.startAt);
    if (same) return;
    onMove(record, {
      masterId: target.column.id,
      date: target.date,
      minutes: minutesOfDay(record.startAt),
    });
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd} autoScroll>
      <div
        style={{
          overflow: 'auto',
          maxHeight: 'calc(100vh - 260px)',
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadiusLG,
          background: token.colorBgContainer,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${NAME_COL}px repeat(7, minmax(150px, 1fr))`,
            minWidth: NAME_COL + 7 * 150,
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              left: 0,
              zIndex: 3,
              background: token.colorBgContainer,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
            }}
          />
          {days.map((d) => (
            <div
              key={d}
              role="button"
              tabIndex={0}
              onClick={() => {
                onOpenDay(d);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onOpenDay(d);
              }}
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                cursor: 'pointer',
                padding: '8px 10px',
                textAlign: 'center',
                background: d === today ? token.colorPrimaryBg : token.colorBgContainer,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                borderLeft: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                {capitalize(asDay(d).format('dddd'))}
              </Typography.Text>
              <div style={{ fontWeight: 600 }}>{asDay(d).format('D MMMM')}</div>
            </div>
          ))}

          {columns.map((c) => (
            <WeekRow key={columnKey(c.id)} {...props} column={c} records={recordsOf(records, c)} />
          ))}
        </div>
      </div>
    </DndContext>
  );
}

function WeekRow(props: WeekGridProps & { column: Column }) {
  const { column, days, records } = props;
  const { token } = theme.useToken();
  return (
    <>
      <div
        style={{
          position: 'sticky',
          left: 0,
          zIndex: 1,
          background: token.colorBgContainer,
          padding: '10px 12px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Typography.Text strong ellipsis style={{ display: 'block' }}>
          {column.color && (
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: 4,
                background: column.color,
                marginRight: 6,
              }}
            />
          )}
          {column.name}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
          {column.id === null ? 'Черга' : 'Майстер'}
        </Typography.Text>
      </div>
      {days.map((d) => (
        <WeekCell
          key={d}
          {...props}
          date={d}
          records={records
            .filter((r) => dayOf(r.startAt) === d)
            .sort((a, b) => a.startAt.localeCompare(b.startAt))}
        />
      ))}
    </>
  );
}

function WeekCell({
  column,
  date,
  records,
  onOpen,
  onCreate,
  canCreateIn,
}: WeekGridProps & { column: Column; date: string }) {
  const { token } = theme.useToken();
  const { setNodeRef, isOver } = useDroppable({
    id: `${columnKey(column.id)}|${date}`,
    data: { column, date },
  });
  const day = column.schedule?.days.find((d) => d.date === date);
  const offDay = column.schedule ? !day?.isWorkDay : false;
  // Клик по пустому месту — запись на начало рабочего дня мастера (или 10:00).
  const firstWindow = day?.windows[0];
  const startMinutes = firstWindow ? parseClock(firstWindow.start) : 10 * 60;

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-card]')) return;
    if (canCreateIn(column)) onCreate({ masterId: column.id, date, minutes: startMinutes });
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      style={{
        minHeight: 96,
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        cursor: canCreateIn(column) ? 'cell' : 'default',
        borderLeft: `1px solid ${token.colorBorderSecondary}`,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        background: isOver
          ? token.colorPrimaryBgHover
          : offDay
            ? token.colorFillTertiary
            : column.id === null
              ? token.colorFillQuaternary
              : undefined,
      }}
    >
      {records.map((r) => (
        <WeekCard key={r.id} record={r} onOpen={onOpen} />
      ))}
    </div>
  );
}

function WeekCard({ record, onOpen }: { record: RecordItem; onOpen: (r: RecordItem) => void }) {
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
        position: 'relative',
        zIndex: isDragging ? 10 : 1,
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        cursor: movable ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
      }}
    >
      <RecordCard
        record={record}
        size="medium"
        onClick={() => {
          onOpen(record);
        }}
      />
    </div>
  );
}
