import { DatePicker } from 'antd';
import dayjs from 'dayjs';

interface DateRangeFilterProps {
  from?: string;
  to?: string;
  /** Дни `YYYY-MM-DD` включительно; обе границы `undefined` — фильтр снят. */
  onChange: (from: string | undefined, to: string | undefined) => void;
  placeholder?: [string, string];
  allowClear?: boolean;
}

/** Фильтр периода для URL-состояния страницы: хранит и отдаёт даты строками. */
export function DateRangeFilter({
  from,
  to,
  onChange,
  placeholder = ['Дата з', 'по'],
  allowClear = true,
}: DateRangeFilterProps) {
  return (
    <DatePicker.RangePicker
      format="DD.MM.YYYY"
      placeholder={placeholder}
      allowClear={allowClear}
      value={from && to ? [dayjs(from), dayjs(to)] : null}
      onChange={(range) => {
        onChange(range?.[0]?.format('YYYY-MM-DD'), range?.[1]?.format('YYYY-MM-DD'));
      }}
    />
  );
}
