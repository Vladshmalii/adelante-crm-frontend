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
