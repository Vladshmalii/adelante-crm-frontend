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

export function LoyaltyTabs({ activeTab, onTabChange }: LoyaltyTabsProps) {
    return (
        <div className="flex flex-nowrap gap-2 border-b border-border overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={clsx(
                            'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap',
                            'hover:text-foreground',
                            isActive
                                ? 'text-primary border-b-2 border-primary -mb-[2px]'
                                : 'text-muted-foreground'
                        )}
                    >
                        <Icon size={18} />
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
