const formatter = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 });

/** Суммы приходят из API строками-decimal (`"1250.00"`). */
export const formatMoney = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === ''
    ? '—'
    : `${formatter.format(Number(value))} ₴`;
