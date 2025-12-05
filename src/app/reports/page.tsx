'use client';

import { AppShell } from '@/shared/components/layout/AppShell';
import { Button } from '@/shared/components/ui/Button';
import { RangeDatePicker } from '@/shared/components/ui/RangeDatePicker';
import { Download, Filter } from 'lucide-react';
import { useState } from 'react';
import { RevenueChart } from '@/features/reports/components/RevenueChart';

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    return (
        <AppShell activeSection="reports">
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-heading text-foreground">Звіти та аналітика</h1>
                        <p className="text-muted-foreground mt-1">Огляд ключових показників ефективності салону</p>
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
                        <Button leftIcon={<Download size={18} />}>
                            Експорт
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Виручка', value: '458 200 ₴', change: '+12%', trend: 'up' },
                        { label: 'Середній чек', value: '1 250 ₴', change: '+5%', trend: 'up' },
                        { label: 'Клієнти', value: '342', change: '-2%', trend: 'down' },
                        { label: 'Записи', value: '418', change: '+8%', trend: 'up' },
                    ].map((kpi, i) => (
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

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RevenueChart />
                    {/* Placeholder for second chart */}
                    <div className="bg-card border border-border p-6 rounded-xl min-h-[400px] flex items-center justify-center text-muted-foreground">
                        Більше графіків незабаром...
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
