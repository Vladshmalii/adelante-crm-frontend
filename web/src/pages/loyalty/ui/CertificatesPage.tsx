import { getRouteApi } from '@tanstack/react-router';

import type { CertificatesTabKey } from '../model/search';
import { CertificatesRegistryTab } from './CertificatesRegistryTab';
import { CertificatesTab } from './CertificatesTab';
import { LoyaltySubpage } from './LoyaltySubpage';

const route = getRouteApi('/_app/loyalty/certificates');

const TABS: { key: CertificatesTabKey; tab: string }[] = [
  { key: 'types', tab: 'Типи сертифікатів' },
  { key: 'issued', tab: 'Видані сертифікати' },
];

/** Шаблоны подарочных сертификатов и реестр выданных (суперюзер). */
export function CertificatesPage() {
  const { tab } = route.useSearch();
  const navigate = route.useNavigate();
  return (
    <LoyaltySubpage
      title="Сертифікати"
      tabList={TABS}
      tabActiveKey={tab}
      onTabChange={(key) => void navigate({ search: { tab: key as CertificatesTabKey } })}
    >
      {tab === 'types' && <CertificatesTab />}
      {tab === 'issued' && <CertificatesRegistryTab />}
    </LoyaltySubpage>
  );
}
