'use client';

import { useState } from 'react';
import { BarChart3, FileText, Receipt, CreditCard, TrendingUp } from 'lucide-react';
import { FinanceDashboard } from '../overview/FinanceDashboard';
import { OperationsView } from '../operations/OperationsView';
import { DocumentsView } from '../documents/DocumentsView';
import { ReceiptsView } from '../receipts/ReceiptsView';
import { PaymentMethodsView } from '../payment-methods/PaymentMethodsView';

type Tab = 'overview' | 'operations' | 'documents' | 'receipts' | 'payment-methods';

export function FinanceTabs() {
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    const tabs = [
        { id: 'overview' as Tab, label: 'Огляд', icon: TrendingUp },
        { id: 'operations' as Tab, label: 'Операції', icon: BarChart3 },
        { id: 'documents' as Tab, label: 'Документи', icon: FileText },
        { id: 'receipts' as Tab, label: 'Чеки / Каси', icon: Receipt },
        { id: 'payment-methods' as Tab, label: 'Методи оплат', icon: CreditCard },
    ];

    return (
        <div className="flex flex-col h-full">
            <div className="border-b border-border bg-card">
                <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-4">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-colors
                  ${activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }
                `}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

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