import { Typography } from 'antd';

/** Подписи полей из журнала изменений бекенда (`details: {field: [old, new]}`). */
const FIELD_LABELS: Record<string, string> = {
  status: 'Статус',
  startAt: 'Початок',
  start_at: 'Початок',
  masterId: 'Майстер',
  master_id: 'Майстер',
  serviceId: 'Послуга',
  service_id: 'Послуга',
  comment: 'Коментар',
  internalNotes: 'Нотатки',
  internal_notes: 'Нотатки',
  importance: 'Важливість',
  price: 'Ціна',
  amount: 'Сума',
  phone: 'Телефон',
  email: 'Email',
  firstName: "Ім'я",
  first_name: "Ім'я",
  lastName: 'Прізвище',
  last_name: 'Прізвище',
  name: 'Назва',
  category: 'Категорія',
  discountPercent: 'Знижка',
  discount_percent: 'Знижка',
  paid: 'Оплачено, ₴',
  salary: 'Оклад',
  position: 'Посада',
};

/** Значения-enum бекенда, которые попадают в журнал как есть. */
const VALUE_LABELS: Record<string, string> = {
  scheduled: 'Очікування',
  confirmed: 'Підтверджено',
  arrived: 'Клієнт прийшов',
  completed: 'Завершено',
  cancelled: 'Скасовано',
  no_show: 'Не прийшов',
  unpaid: 'Не оплачено',
  partial: 'Частково',
  paid: 'Оплачено',
  active: 'Активний',
  inactive: 'Неактивний',
  archived: 'Архівний',
  vacation: 'У відпустці',
  sick: 'На лікарняному',
  fired: 'Звільнений',
  draft: 'Чернетка',
  issued: 'Виписано',
  standard: 'Стандартний',
  important: 'Важливий',
  special: 'Особливий',
};

const show = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string') return VALUE_LABELS[value] ?? value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
};

/** Что изменилось: «Поле: было → стало». Формат, отличный от пар, выводится как есть. */
export function ChangeDetails({ details }: { details: Record<string, unknown> | null }) {
  if (!details || Object.keys(details).length === 0) return null;
  return (
    <div>
      {Object.entries(details).map(([field, change]) => (
        <div key={field}>
          <Typography.Text type="secondary">{FIELD_LABELS[field] ?? field}: </Typography.Text>
          {Array.isArray(change) && change.length === 2 ? (
            <>
              <Typography.Text delete>{show(change[0])}</Typography.Text>
              {' → '}
              {show(change[1])}
            </>
          ) : (
            show(change)
          )}
        </div>
      ))}
    </div>
  );
}
