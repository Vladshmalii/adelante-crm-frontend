'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps
} from 'recharts';
import { Card } from '@/shared/components/ui/Card';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';

const data = [
    { month: 'Лип', newClients: 45, returning: 120 },
    { month: 'Сер', newClients: 52, returning: 135 },
    { month: 'Вер', newClients: 38, returning: 142 },
    { month: 'Жов', newClients: 61, returning: 128 },
    { month: 'Лис', newClients: 48, returning: 155 },
    { month: 'Гру', newClients: 55, returning: 148 },
];

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
                <p className="text-sm font-semibold mb-2">{label}</p>
                <div className="space-y-1">
                    <p className="text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Нові: <span className="font-medium">{payload[0]?.value}</span>
                    </p>
                    <p className="text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Повторні: <span className="font-medium">{payload[1]?.value}</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export function ClientsChart() {
    const totalNew = data.reduce((sum, item) => sum + item.newClients, 0);
    const totalReturning = data.reduce((sum, item) => sum + item.returning, 0);
    const retentionRate = Math.round((totalReturning / (totalNew + totalReturning)) * 100);

    const lastMonth = data[data.length - 1];
    const prevMonth = data[data.length - 2];
    const newClientsChange = Math.round(((lastMonth.newClients - prevMonth.newClients) / prevMonth.newClients) * 100);
    const returningChange = Math.round(((lastMonth.returning - prevMonth.returning) / prevMonth.returning) * 100);

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold font-heading">Динаміка клієнтів</h3>
                    <p className="text-sm text-muted-foreground">Нові та повторні візити</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-primary/5 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted-foreground">Нові клієнти</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{totalNew}</p>
                    <div className={`flex items-center gap-1 text-xs mt-1 ${newClientsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {newClientsChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(newClientsChange)}%
                    </div>
                </div>

                <div className="p-4 bg-green-500/5 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-muted-foreground">Повторні</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{totalReturning}</p>
                    <div className={`flex items-center gap-1 text-xs mt-1 ${returningChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {returningChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(returningChange)}%
                    </div>
                </div>

                <div className="p-4 bg-purple-500/5 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="text-xs text-muted-foreground">Утримання</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{retentionRate}%</p>
                    <p className="text-xs text-muted-foreground mt-1">клієнтів повертаються</p>
                </div>
            </div>

            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }} />
                        <Bar dataKey="newClients" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="returning" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
