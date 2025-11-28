import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from '@/shared/components/ui/ChartCard';

const revenueData = [
    { day: '22.11', amount: 12500 },
    { day: '23.11', amount: 15800 },
    { day: '24.11', amount: 11200 },
    { day: '25.11', amount: 18400 },
    { day: '26.11', amount: 16700 },
    { day: '27.11', amount: 14300 },
    { day: '28.11', amount: 19500 },
];

const paymentsData = [
    { day: '22.11', count: 28 },
    { day: '23.11', count: 35 },
    { day: '24.11', count: 24 },
    { day: '25.11', count: 42 },
    { day: '26.11', count: 38 },
    { day: '27.11', count: 31 },
    { day: '28.11', count: 45 },
];

export function FinanceChartsRow() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Дохід по днях">
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="day"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            stroke="hsl(var(--border))"
                        />
                        <YAxis
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            stroke="hsl(var(--border))"
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="amount"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--primary))' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Кількість оплат по днях">
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={paymentsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="day"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            stroke="hsl(var(--border))"
                        />
                        <YAxis
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            stroke="hsl(var(--border))"
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                            }}
                        />
                        <Bar
                            dataKey="count"
                            fill="hsl(var(--accent))"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
}