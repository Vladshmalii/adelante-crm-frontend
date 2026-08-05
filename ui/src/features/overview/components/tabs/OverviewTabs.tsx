import { OVERVIEW_TABS } from '../../constants';
import type { OverviewTab } from '../../types';

interface OverviewTabsProps {
    activeTab: OverviewTab;
    onTabChange: (tab: OverviewTab) => void;
}

export function OverviewTabs({ activeTab, onTabChange }: OverviewTabsProps) {
    return (
        <div className="mb-6 flex items-center gap-6 border-b border-border">
            {OVERVIEW_TABS.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`relative px-1 pb-3 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    } `}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" />
                    )}
                </button>
            ))}
        </div>
    );
}
