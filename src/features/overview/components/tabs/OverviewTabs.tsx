import { OVERVIEW_TABS } from '../../constants';
import type { OverviewTab } from '../../types';

interface OverviewTabsProps {
    activeTab: OverviewTab;
    onTabChange: (tab: OverviewTab) => void;
}

export function OverviewTabs({ activeTab, onTabChange }: OverviewTabsProps) {
    return (
        <div className="flex items-center gap-6 border-b border-border mb-6">
            {OVERVIEW_TABS.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
            relative pb-3 px-1 text-sm font-medium transition-colors
            ${
                        activeTab === tab.id
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    }
          `}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
            ))}
        </div>
    );
}