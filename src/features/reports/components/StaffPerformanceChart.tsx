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

const data = [
    { name: 'Юлія', appointments: 45, revenue: 67500, avgCheck: 1500 },
    { name: 'Анжела', appointments: 38, revenue: 45600, avgCheck: 1200 },
    { name: 'Світлана', appointments: 52, revenue: 41600, avgCheck: 800 },
    { name: 'Кристина', appointments: 48, revenue: 38400, avgCheck: 800 },
    { name: 'Елизавета', appointments: 35, revenue: 35000, avgCheck: 1000 },
    { name: 'Косметолог', appointments: 28, revenue: 42000, avgCheck: 1500 },
];

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
                <p className="text-sm font-semibold mb-2">{label}</p>
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                        Записів: <span className="font-medium text-foreground">{payload[0]?.payload?.appointments}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Виручка: <span className="font-medium text-primary">{payload[0]?.value?.toLocaleString('uk-UA')} ₴</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Середній чек: <span className="font-medium text-foreground">{payload[0]?.payload?.avgCheck?.toLocaleString('uk-UA')} ₴</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export function StaffPerformanceChart() {
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalAppointments = data.reduce((sum, item) => sum + item.appointments, 0);

    return (
        <Card className="p-6 h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold font-heading">Ефективність співробітників</h3>
                    <p className="text-sm text-muted-foreground">Виручка за період</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{totalRevenue.toLocaleString('uk-UA')} ₴</p>
                    <p className="text-xs text-muted-foreground">{totalAppointments} записів загалом</p>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical">
                        <defs>
                            <linearGradient id="colorStaff" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                            type="number"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            tickFormatter={(value) => `${value / 1000}k`}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            width={80}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }} />
                        <Bar
                            dataKey="revenue"
                            fill="url(#colorStaff)"
                            radius={[0, 4, 4, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
