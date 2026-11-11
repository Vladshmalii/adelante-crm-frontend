import { ClientBalancesTab } from './ClientBalancesTab';
import { LoyaltySubpage } from './LoyaltySubpage';

/**
 * Депозиты на счетах клиентов (суперюзер). Счёт один на клиента на сеть, типов счетов нет
 * (frontend-loyalty-page.md, решение 4); операции со счётом — в карточке клиента.
 */
export function DepositsPage() {
  return (
    <LoyaltySubpage title="Депозити на рахунках клієнтів">
      <ClientBalancesTab />
    </LoyaltySubpage>
  );
}
