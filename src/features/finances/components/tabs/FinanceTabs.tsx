'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { BarChart3, FileText, Receipt, CreditCard, TrendingUp } from 'lucide-react';
import { FinanceDashboard } from '../overview/FinanceDashboard';
import { OperationsView } from '../operations/OperationsView';
import { DocumentsView } from '../documents/DocumentsView';
import { ReceiptsView } from '../receipts/ReceiptsView';
import { PaymentMethodsView } from '../payment-methods/PaymentMethodsView';
import { PageTabs } from '@/shared/components/ui/PageTabs';

type Tab = 'overview' | 'operations' | 'documents' | 'receipts' | 'payment-methods';

export function FinanceTabs() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    
    const tabParam = searchParams.get('tab') as Tab | null;
    const activeTab = tabParam || 'overview';

    const setActiveTab = (id: Tab) => {
        router.push(`${pathname}?tab=${id}`);
    };

    const tabs = [
        { id: 'overview' as Tab, label: 'Огляд', icon: TrendingUp },
        { id: 'operations' as Tab, label: 'Операції', icon: BarChart3 },
        { id: 'documents' as Tab, label: 'Документи', icon: FileText },
        { id: 'receipts' as Tab, label: 'Чеки / Каси', icon: Receipt },
        { id: 'payment-methods' as Tab, label: 'Методи оплат', icon: CreditCard },
    ];

    return (
        <div className="flex flex-col h-full">
            <PageTabs tabs={tabs} activeTab={activeTab} baseHref="/finances" />

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'overview' && <FinanceDashboard />}
                {activeTab === 'operations' && <OperationsView />}
                {activeTab === 'documents' && <DocumentsView />}
                {activeTab === 'receipts' && <ReceiptsView />}
                {activeTab === 'payment-methods' && <PaymentMethodsView />}
            </div>
        </div>
    );
}