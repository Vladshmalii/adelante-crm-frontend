import type { Schema } from '@/shared/api';

import { dayOf } from './time';

type MasterSchedule = Schema<'MasterScheduleOut'>;
type RecordItem = Schema<'RecordOut'>;

/** Колонка сетки: мастер или очередь «Без майстра» (`id = null`). */
export interface Column {
  id: string | null;
  name: string;
  color: string | null;
  schedule?: MasterSchedule;
}

export const QUEUE: Column = { id: null, name: 'Без майстра', color: null };

/** Ключ колонки для drag-and-drop и React. */
export const columnKey = (id: string | null) => id ?? 'queue';

interface BuildColumnsArgs {
  schedule: MasterSchedule[];
  records: RecordItem[];
  /** Дни, которые показывает вид (день или неделя). */
  days: string[];
  staff: 'all' | 'working';
  hide: string[];
  /** Очередь «Без майстра» — только администратору (мастер работает со своими записями). */
  withQueue: boolean;
}

/** Работает ли мастер в эти дни или у него есть записи — фильтр «Сьогодні». */
export function isWorking(m: MasterSchedule, days: string[], records: RecordItem[]) {
  const set = new Set(days);
  return (
    m.days.some((d) => set.has(d.date) && d.isWorkDay) ||
    records.some((r) => r.master?.id === m.masterId && set.has(dayOf(r.startAt)))
  );
}

export function buildColumns({
  schedule,
  records,
  days,
  staff,
  hide,
  withQueue,
}: BuildColumnsArgs): Column[] {
  const masters = schedule
    .filter((m) => staff === 'all' || isWorking(m, days, records))
    .filter((m) => !hide.includes(m.masterId))
    .map((m) => ({ id: m.masterId, name: m.name, color: m.color, schedule: m }));
  return withQueue ? [QUEUE, ...masters] : masters;
}

/** Записи колонки (отменённые в сетке не показываем). */
export const recordsOf = (records: RecordItem[], column: Column) =>
  records.filter((r) => r.status !== 'cancelled' && (r.master?.id ?? null) === column.id);

/** Можно ли переносить запись: завершённые, отменённые и неявки уже не двигаются. */
export const isMovable = (r: RecordItem) =>
  r.status === 'scheduled' || r.status === 'confirmed' || r.status === 'arrived';
