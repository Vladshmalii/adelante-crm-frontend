'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps
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
            <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
                <p className="text-sm font-medium mb-1">{label}</p>
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
        <Card className="p-6 h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold font-heading">Динаміка виручки</h3>
                    <p className="text-sm text-muted-foreground">За останні 7 днів</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-primary">112 500 ₴</p>
                    <p className="text-xs text-muted-foreground">+12.5% до минулого тижня</p>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
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
