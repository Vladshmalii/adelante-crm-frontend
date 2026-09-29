/**
 * Раскладка сетки дня: где рисовать записи, перерывы и нерабочее время. Чистые функции от
 * минут от полуночи — без React и дат, чтобы их можно было проверить тестами.
 */

export interface Interval {
  start: number;
  end: number;
}

export interface Placed<T> extends Interval {
  item: T;
  /** Дорожка внутри группы пересекающихся записей и число дорожек в группе. */
  lane: number;
  lanes: number;
}

/**
 * Пересекающиеся записи одного мастера ставятся рядом по дорожкам: каждая группа
 * пересечений делит ширину колонки на число одновременно идущих записей.
 */
export function placeOverlapping<T>(items: (Interval & { item: T })[]): Placed<T>[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const result: Placed<T>[] = [];
  let group: Placed<T>[] = [];
  let laneEnds: number[] = [];
  let groupEnd = -Infinity;

  const flush = () => {
    for (const p of group) p.lanes = laneEnds.length;
    result.push(...group);
    group = [];
    laneEnds = [];
  };

  for (const it of sorted) {
    if (it.start >= groupEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= it.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(it.end);
    } else {
      laneEnds[lane] = it.end;
    }
    group.push({ ...it, lane, lanes: 1 });
    groupEnd = Math.max(groupEnd, it.end);
  }
  flush();
  return result;
}

/** Короткие промежутки между записями мастера (до `maxGap` минут) — карточки «Перерва». */
export function shortBreaks(items: Interval[], maxGap = 15): Interval[] {
  const sorted = [...items].sort((a, b) => a.start - b.start);
  const breaks: Interval[] = [];
  let lastEnd = -Infinity;
  for (const it of sorted) {
    const gap = it.start - lastEnd;
    if (gap > 0 && gap <= maxGap) breaks.push({ start: lastEnd, end: it.start });
    lastEnd = Math.max(lastEnd, it.end);
  }
  return breaks;
}

/** Нерабочее время внутри видимых часов: всё, что не покрыто окнами графика. */
export function offHours(windows: Interval[], from: number, to: number): Interval[] {
  const sorted = [...windows].sort((a, b) => a.start - b.start);
  const result: Interval[] = [];
  let cursor = from;
  for (const w of sorted) {
    if (w.start > cursor) result.push({ start: cursor, end: Math.min(w.start, to) });
    cursor = Math.max(cursor, w.end);
    if (cursor >= to) break;
  }
  if (cursor < to) result.push({ start: cursor, end: to });
  return result.filter((i) => i.end > i.start);
}

/**
 * Видимые часы дня: по умолчанию 08:00–20:00, расширяются до самой ранней и самой поздней
 * записи или окна графика (с округлением до часа).
 */
export function visibleHours(intervals: Interval[], min = 8 * 60, max = 20 * 60): Interval {
  let start = min;
  let end = max;
  for (const i of intervals) {
    start = Math.min(start, Math.floor(i.start / 60) * 60);
    end = Math.max(end, Math.ceil(i.end / 60) * 60);
  }
  return { start: Math.max(0, start), end: Math.min(24 * 60, end) };
}

/** Перенос перетаскиванием: сдвиг в пикселях → новое начало, кратное шагу, внутри суток. */
export function snapMove(start: number, deltaPx: number, pxPerMinute: number, step: number) {
  const moved = start + deltaPx / pxPerMinute;
  const snapped = Math.round(moved / step) * step;
  return Math.min(Math.max(snapped, 0), 24 * 60 - step);
}

/** Пересекается ли интервал с чужими записями мастера (проверка занятости). */
export const overlapsAny = (target: Interval, others: Interval[]) =>
  others.some((o) => o.start < target.end && target.start < o.end);
