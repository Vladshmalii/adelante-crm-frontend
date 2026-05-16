import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export interface TabItem {
    id: string;
    label: string;
    icon?: React.ElementType;
    href?: string;
}

interface PageTabsProps {
    tabs: TabItem[];
    activeTab: string;
    onTabChange?: (tabId: string) => void;
    baseHref?: string; // e.g. '/finances'
}

export function PageTabs({ tabs, activeTab, onTabChange, baseHref }: PageTabsProps) {
    return (
        <div className="px-4 sm:px-6 border-b border-border bg-card">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    
                    const content = (
                        <>
                            {Icon && <Icon size={18} />}
                            {tab.label}
                        </>
                    );

                    const className = cn(
                        "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                        isActive
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                    );

                    if (baseHref || tab.href) {
                        return (
                            <Link
                                key={tab.id}
                                href={tab.href || `${baseHref}?tab=${tab.id}`}
                                className={className}
                                scroll={false}
                            >
                                {content}
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange?.(tab.id)}
                            className={className}
                        >
                            {content}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
