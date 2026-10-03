import dayjs from 'dayjs';

import type { Schema } from '@/shared/api';
import { inSalonTz } from '@/shared/lib';

type Service = Schema<'app__api__booking__router__ServiceOut'>;
type Slot = Schema<'app__api__booking__router__SlotOut'>;

export interface ServiceGroup {
  id: string;
  name: string;
  services: Service[];
}

/** Услуги по категориям в порядке первого появления (бекенд уже сортирует по категории). */
export function groupServices(services: Service[]): ServiceGroup[] {
  const groups = new Map<string, ServiceGroup>();
  for (const s of services) {
    const group = groups.get(s.category_id) ?? {
      id: s.category_id,
      name: s.category_name,
      services: [],
    };
    group.services.push(s);
    groups.set(s.category_id, group);
  }
  return [...groups.values()];
}

export type DayPart = 'morning' | 'day' | 'evening';

export const DAY_PART_LABELS: Record<DayPart, string> = {
  morning: 'Ранок',
  day: 'День',
  evening: 'Вечір',
};

/** Свободное время по частям дня (по времени салона): до 12:00, до 17:00, вечер. */
export function slotsByPart(slots: Slot[]): [DayPart, Slot[]][] {
  const parts: Record<DayPart, Slot[]> = { morning: [], day: [], evening: [] };
  for (const slot of slots) {
    const hour = inSalonTz(slot.start_at).hour();
    parts[hour < 12 ? 'morning' : hour < 17 ? 'day' : 'evening'].push(slot);
  }
  return (Object.keys(parts) as DayPart[])
    .filter((p) => parts[p].length > 0)
    .map((p) => [p, parts[p]]);
}

/** Месяц `YYYY-MM` для запроса доступных дней. */
export const monthOf = (date: string) => date.slice(0, 7);

/** «90 хв» / «1 год 30 хв». */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} хв`;
  return m ? `${h} год ${m} хв` : `${h} год`;
}

/** Дата визита для людей: «середа, 7 жовтня» и время «14:30». */
export const visitDate = (iso: string) => inSalonTz(iso).format('dddd, D MMMM');
export const visitTime = (iso: string) => inSalonTz(iso).format('HH:mm');

const icsDate = (iso: string) => dayjs(iso).utc().format('YYYYMMDD[T]HHmmss[Z]');
const icsText = (text: string) => text.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');

/** Файл календаря (.ics) для кнопки «Додати в календар». */
export function buildIcs(event: {
  uid: string;
  start: string;
  end: string;
  title: string;
  location?: string | null;
  description?: string | null;
}): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Adelante CRM//Booking//UK',
    'BEGIN:VEVENT',
    `UID:${event.uid}@adelante`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(event.start)}`,
    `DTEND:${icsDate(event.end)}`,
    `SUMMARY:${icsText(event.title)}`,
    ...(event.location ? [`LOCATION:${icsText(event.location)}`] : []),
    ...(event.description ? [`DESCRIPTION:${icsText(event.description)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}
