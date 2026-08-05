'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps,
} from 'recharts';
import { Card } from '@/shared/components/ui/Card';
import { RevenueChart } from '@/features/reports/components/RevenueChart';

const paymentsData = [
    { day: '22.11', count: 28 },
    { day: '23.11', count: 35 },
    { day: '24.11', count: 24 },
    { day: '25.11', count: 42 },
    { day: '26.11', count: 38 },
    { day: '27.11', count: 31 },
    { day: '28.11', count: 45 },
];

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                <p className="mb-1 text-sm font-medium">{label}</p>
                <p className="text-sm font-bold text-primary">{payload[0].value} оплат</p>
            </div>
        );
    }
    return null;
};

function PaymentsChart() {
    return (
        <Card className="flex h-[400px] flex-col p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="font-heading text-lg font-semibold">Кількість оплат</h3>
                    <p className="text-sm text-muted-foreground">По днях</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">243</p>
                    <p className="text-xs text-muted-foreground">Всього за тиждень</p>
                </div>
            </div>

            <div className="min-h-0 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentsData}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="hsl(var(--border))"
                        />
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                        />
                        <Bar
                            dataKey="count"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                            barSize={32}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

export function FinanceChartsRow() {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RevenueChart />
            <PaymentsChart />
        </div>
    );
}
