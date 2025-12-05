'use client';

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    TooltipProps,
    Legend
} from 'recharts';
import { Card } from '@/shared/components/ui/Card';

const data = [
    { name: 'Перукарські', value: 45, color: 'hsl(160, 60%, 45%)' },
    { name: 'Манікюр/Педикюр', value: 30, color: 'hsl(200, 70%, 50%)' },
    { name: 'Косметологія', value: 15, color: 'hsl(280, 60%, 55%)' },
    { name: 'Візаж', value: 10, color: 'hsl(30, 80%, 55%)' },
];

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
                <p className="text-sm font-semibold">{payload[0].name}</p>
                <p className="text-xs text-muted-foreground">
                    Частка: <span className="font-medium text-primary">{payload[0].value}%</span>
                </p>
            </div>
        );
    }
    return null;
};

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.1) return null;

    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor="middle"
            dominantBaseline="central"
            className="text-xs font-medium"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export function ServicesPopularityChart() {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card className="p-6 h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold font-heading">Популярність послуг</h3>
                    <p className="text-sm text-muted-foreground">Розподіл за категоріями</p>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0 flex">
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={100}
                                innerRadius={50}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="w-48 flex flex-col justify-center space-y-3">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.value}%</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}
