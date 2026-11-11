import { LoyaltySubpage } from './LoyaltySubpage';
import { LoyaltyTab } from './LoyaltyTab';

/** Типы карт, уровни и бонусные правила (суперюзер). */
export function LoyaltyCardsPage() {
  return (
    <LoyaltySubpage title="Карти лояльності, знижки та Кешбек">
      <LoyaltyTab />
    </LoyaltySubpage>
  );
}
