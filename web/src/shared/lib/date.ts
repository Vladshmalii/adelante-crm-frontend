import dayjs, { type Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

/** Все даты и время в CRM показываются в поясе салона, а не браузера. */
export const SALON_TZ = 'Europe/Kyiv';

/** Момент времени (ISO с зоной) → время салона. */
export const inSalonTz = (value: string | Date | Dayjs) => dayjs(value).tz(SALON_TZ);

export const formatDateTime = (value: string | null | undefined) =>
  value ? inSalonTz(value).format('DD.MM.YYYY HH:mm') : '—';

/** Календарная дата без времени (`YYYY-MM-DD`: день рождения, дата приёма) — без пересчёта зоны. */
export const formatDate = (value: string | null | undefined) =>
  value ? dayjs(value).format('DD.MM.YYYY') : '—';

/** Dayjs из DatePicker → `YYYY-MM-DD` для полей-дат API. */
export const toApiDate = (value: Dayjs | null | undefined) =>
  value ? value.format('YYYY-MM-DD') : null;

export const fromApiDate = (value: string | null | undefined) => (value ? dayjs(value) : undefined);

/**
 * Дни `YYYY-MM-DD` (включительно) → интервал для API `[dateFrom, dateTo)`: бекенд сравнивает
 * моменты времени, поэтому границы — начала суток в поясе салона.
 */
export const dayRangeToApi = (from?: string, to?: string) => ({
  dateFrom: from ? dayjs.tz(from, SALON_TZ).startOf('day').toISOString() : undefined,
  dateTo: to ? dayjs.tz(to, SALON_TZ).add(1, 'day').startOf('day').toISOString() : undefined,
});

/** Время салона → значение для DatePicker (picker работает в поясе браузера). */
export const toPickerDateTime = (iso: string) => dayjs(inSalonTz(iso).format('YYYY-MM-DDTHH:mm'));

/** Значение DatePicker с временем (как время салона) → ISO для API. */
export const fromPickerDateTime = (value: Dayjs) =>
  dayjs.tz(value.format('YYYY-MM-DDTHH:mm'), SALON_TZ).toISOString();

/** Текущий месяц салона как `[YYYY-MM-DD, YYYY-MM-DD]`. */
export const currentMonth = (): [string, string] => {
  const now = inSalonTz(new Date());
  return [now.startOf('month').format('YYYY-MM-DD'), now.endOf('month').format('YYYY-MM-DD')];
};
