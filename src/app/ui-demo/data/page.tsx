'use client';

import { useState } from 'react';
import { ClientsTable } from '@/features/clients/components/ClientsTable';
import { RevenueChart } from '@/features/reports/components/RevenueChart';
import { ClientsChart } from '@/features/reports/components/ClientsChart';
import { ServicesPopularityChart } from '@/features/reports/components/ServicesPopularityChart';
import { StaffPerformanceChart } from '@/features/reports/components/StaffPerformanceChart';
import type { Client } from '@/features/clients/types';
import { Card } from '@/shared/components/ui/Card';

const mockClients: Client[] = [
    {
        id: '1',
        firstName: 'Іван',
        lastName: 'Петренко',
        phone: '+380671234567',
        email: 'ivan@example.com',
        totalSpent: 12500,
        totalVisits: 5,
        discount: 0,
        lastVisit: '2023-11-20',
        firstVisit: '2023-01-10',
        segment: 'repeat'
    },
    {
        id: '2',
        firstName: 'Олена',
        lastName: 'Коваль',
        phone: '+380509876543',
        email: 'olena@example.com',
        totalSpent: 4500,
        totalVisits: 2,
        discount: 5,
        lastVisit: '2023-12-01',
        firstVisit: '2023-10-15',
        segment: 'new'
    },
    {
        id: '3',
        firstName: 'Максим',
        lastName: 'Мельник',
        phone: '+380931122334',
        email: 'maksym@example.com',
        totalSpent: 28900,
        totalVisits: 12,
        discount: 10,
        lastVisit: '2023-11-25',
        firstVisit: '2022-05-20',
        segment: 'repeat'
    },
    {
        id: '4',
        firstName: 'Тетяна',
        lastName: 'Бойко',
        phone: '+380685556677',
        email: 'tanya@example.com',
        totalSpent: 1200,
        totalVisits: 1,
        discount: 0,
        lastVisit: '2023-10-05',
        firstVisit: '2023-10-05',
        segment: 'lost'
    }
];

const kpiData = [
    { label: 'Виручка', value: '458 200 ₴', change: '+12%', trend: 'up' },
    { label: 'Середній чек', value: '1 250 ₴', change: '+5%', trend: 'up' },
    { label: 'Клієнти', value: '342', change: '-2%', trend: 'down' },
    { label: 'Записи', value: '418', change: '+8%', trend: 'up' },
];

export default function DataDemo() {
    const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());

    const toggleClient = (clientId: string) => {
        const next = new Set(selectedClients);
        if (next.has(clientId)) {
            next.delete(clientId);
        } else {
            next.add(clientId);
        }
        setSelectedClients(next);
    };

    const toggleAll = () => {
        if (selectedClients.size === mockClients.length) {
            setSelectedClients(new Set());
        } else {
            setSelectedClients(new Set(mockClients.map(c => String(c.id))));
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            <h1 className="text-3xl font-bold text-foreground font-heading">Дані та Графіки</h1>

            {/* KPI Cards */}
            <section className="space-y-6">
                <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Картки статистики (KPI)</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpiData.map((kpi, i) => (
                        <div key={i} className="bg-card border border-border p-6 rounded-xl hover:shadow-md transition-shadow">
                            <p className="text-sm text-muted-foreground mb-2">{kpi.label}</p>
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-bold">{kpi.value}</span>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${kpi.trend === 'up'
                                    ? 'bg-green-500/10 text-green-600'
                                    : 'bg-red-500/10 text-red-600'
                                    }`}>
                                    {kpi.change}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Charts */}
            <section className="space-y-6">
                <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Графіки та Дашборди</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RevenueChart />
                    <StaffPerformanceChart />
                    <ServicesPopularityChart />
                    <ClientsChart />
                </div>
            </section>

            {/* Table */}
            <section className="space-y-6">
                <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Таблиці даних</h2>
                <div className="bg-card rounded-lg shadow-sm border border-border">
                    <ClientsTable
                        clients={mockClients}
                        selectedClients={selectedClients}
                        onToggleClient={(id) => toggleClient(String(id))}
                        onToggleAll={toggleAll}
                        onClientClick={(client) => console.log('Click client', client)}
                        onEditClient={(client) => console.log('Edit client', client)}
                        onDeleteClient={(client) => console.log('Delete client', client)}
                    />
                </div>
                <div className="text-sm text-muted-foreground text-center">
                    * Таблиця використовує реальний компонент <code>ClientsTable</code> з демо-даними.
                </div>
            </section>
        </div>
    );
}
