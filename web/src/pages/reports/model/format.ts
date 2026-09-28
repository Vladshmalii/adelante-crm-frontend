import dayjs from 'dayjs';

import type { GroupBy } from './search';

/** Подпись периода на графике: день и неделя — дата начала, месяц — «вер. 2026». */
export const periodLabel = (period: string, groupBy: GroupBy) =>
  groupBy === 'month' ? dayjs(period).format('MMM YYYY') : dayjs(period).format('DD.MM');

/** Изменение к предыдущему периоду: «+12,5%» / «−3%»; `null` — сравнивать не с чем. */
export const formatChange = (percent: number | null | undefined) => {
  if (percent === null || percent === undefined) return null;
  const abs = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 }).format(
    Math.abs(percent),
  );
  return `${percent > 0 ? '+' : percent < 0 ? '−' : ''}${abs}%`;
};
