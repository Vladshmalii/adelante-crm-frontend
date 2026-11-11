import { getRouteApi } from '@tanstack/react-router';

import type { SubscriptionsTabKey } from '../model/search';
import { LoyaltySubpage } from './LoyaltySubpage';
import { SubscriptionsRegistryTab } from './SubscriptionsRegistryTab';
import { SubscriptionTypesTab } from './SubscriptionTypesTab';

const route = getRouteApi('/_app/loyalty/subscriptions');

const TABS: { key: SubscriptionsTabKey; tab: string }[] = [
  { key: 'types', tab: 'Типи абонементів' },
  { key: 'sold', tab: 'Продані абонементи' },
];

/** Типы абонементов и реестр проданных (суперюзер, frontend-subscriptions.md, 2.1). */
export function SubscriptionsPage() {
  const { tab } = route.useSearch();
  const navigate = route.useNavigate();
  return (
    <LoyaltySubpage
      title="Абонементи"
      tabList={TABS}
      tabActiveKey={tab}
      onTabChange={(key) => void navigate({ search: { tab: key as SubscriptionsTabKey } })}
    >
      {tab === 'types' && <SubscriptionTypesTab />}
      {tab === 'sold' && <SubscriptionsRegistryTab />}
    </LoyaltySubpage>
  );
}
