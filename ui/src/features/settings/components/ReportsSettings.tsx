'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { RangeDatePicker } from '@/shared/components/ui/RangeDatePicker';
import { Download, Filter } from 'lucide-react';
import { RevenueChart } from '@/features/reports/components/RevenueChart';
import { StaffPerformanceChart } from '@/features/reports/components/StaffPerformanceChart';
import { ServicesPopularityChart } from '@/features/reports/components/ServicesPopularityChart';
import { ClientsChart } from '@/features/reports/components/ClientsChart';

export function ReportsSettings() {
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h2 className="font-heading text-2xl font-bold text-foreground">
                        Звіти та аналітика
                    </h2>
                    <p className="mt-1 text-muted-foreground">
                        Огляд ключових показників ефективності салону
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <RangeDatePicker
                        value={dateRange}
                        onChange={setDateRange}
                        placeholder="Оберіть період"
                    />
                    <Button variant="secondary" leftIcon={<Filter size={18} />}>
                        Фільтри
                    </Button>
                    <Button leftIcon={<Download size={18} />}>Експорт</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Виручка', value: '458 200 ₴', change: '+12%', trend: 'up' },
                    { label: 'Середній чек', value: '1 250 ₴', change: '+5%', trend: 'up' },
                    { label: 'Клієнти', value: '342', change: '-2%', trend: 'down' },
                    { label: 'Записи', value: '418', change: '+8%', trend: 'up' },
                ].map((kpi, i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
                    >
                        <p className="mb-2 text-sm text-muted-foreground">{kpi.label}</p>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold">{kpi.value}</span>
                            <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                    kpi.trend === 'up'
                                        ? 'bg-green-500/10 text-green-600'
                                        : 'bg-red-500/10 text-red-600'
                                }`}
                            >
                                {kpi.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <RevenueChart />
                <StaffPerformanceChart />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ServicesPopularityChart />
                <ClientsChart />
            </div>
        </div>
    );
}
