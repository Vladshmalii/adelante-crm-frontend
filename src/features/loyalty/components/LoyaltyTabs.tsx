import clsx from 'clsx';
import { Gift, Percent, CreditCard, Users } from 'lucide-react';

import type { LoyaltyTab } from '../types';

interface LoyaltyTabsProps {
    activeTab: LoyaltyTab;
    onTabChange: (tab: LoyaltyTab) => void;
}

const tabs = [
    { id: 'bonuses' as const, label: 'Бонусні програми', icon: Gift },
    { id: 'discounts' as const, label: 'Знижки', icon: Percent },
    { id: 'certificates' as const, label: 'Сертифікати', icon: CreditCard },
    { id: 'clientBonuses' as const, label: 'Бонуси клієнтів', icon: Users },
];

import { PageTabs } from '@/shared/components/ui/PageTabs';

export function LoyaltyTabs({ activeTab, onTabChange }: LoyaltyTabsProps) {
    return (
        <PageTabs 
            tabs={tabs} 
            activeTab={activeTab} 
            onTabChange={(tabId) => onTabChange(tabId as LoyaltyTab)} 
            baseHref="/loyalty"
        />
    );
}
