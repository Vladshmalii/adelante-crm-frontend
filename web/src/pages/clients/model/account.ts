import type { Schema } from '@/shared/api';
import { formatMoney } from '@/shared/lib';

type Client = Schema<'ClientOut'>;

/** Удаление разрешено и при ненулевом балансе — счёт сохраняется (раздел 5.5). */
export function deleteWarning(client: Pick<Client, 'accountBalance'>) {
  const balance = Number(client.accountBalance);
  if (balance > 0) return `У клієнта депозит ${formatMoney(balance)}. Рахунок збережеться.`;
  if (balance < 0) return `У клієнта борг ${formatMoney(-balance)}. Рахунок збережеться.`;
  return 'Цю дію неможливо скасувати.';
}
