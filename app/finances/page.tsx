'use client';

import { AppShell } from '@/shared/components/layout/AppShell';
import { FinanceTabs } from '@/features/finances/components/tabs/FinanceTabs';

export default function FinancesPage() {
    return (
        <AppShell activeSection="finances">
            <div className="h-full flex flex-col">
                <div className="px-4 sm:px-6 py-4 border-b border-border bg-card">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Фінанси</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Управління фінансовими операціями та звітність
                    </p>
                </div>
                <div className="flex-1 overflow-hidden">
                    <FinanceTabs />
                </div>
            </div>
        </AppShell>
    );
}