'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps,
} from 'recharts';
import { Card } from '@/shared/components/ui/Card';

const data = [
    { name: '01.12', value: 12000 },
    { name: '02.12', value: 15500 },
    { name: '03.12', value: 11000 },
    { name: '04.12', value: 18000 },
    { name: '05.12', value: 14500 },
    { name: '06.12', value: 19500 },
    { name: '07.12', value: 22000 },
];

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                <p className="mb-1 text-sm font-medium">{label}</p>
                <p className="text-sm font-bold text-primary">
                    {payload[0].value?.toLocaleString('uk-UA')} ₴
                </p>
            </div>
        );
    }
    return null;
};

export function RevenueChart() {
    return (
        <Card className="flex h-[400px] flex-col p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="font-heading text-lg font-semibold">Динаміка виручки</h3>
                    <p className="text-sm text-muted-foreground">За останні 7 днів</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-primary">112 500 ₴</p>
                    <p className="text-xs text-muted-foreground">+12.5% до минулого тижня</p>
                </div>
            </div>

            <div className="min-h-0 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="hsl(var(--primary))"
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="hsl(var(--primary))"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="hsl(var(--border))"
                        />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            tickFormatter={(value) => `${value / 1000}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
