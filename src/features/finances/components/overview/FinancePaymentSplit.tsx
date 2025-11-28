import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChartCard } from '@/shared/components/ui/ChartCard';

const paymentData = [
    { name: 'Готівка', value: 12800, percent: 30.2 },
    { name: 'Картка', value: 18450, percent: 43.6 },
    { name: 'Онлайн', value: 8100, percent: 19.1 },
    { name: 'Сертифікати', value: 2000, percent: 4.7 },
    { name: 'Бонуси', value: 1000, percent: 2.4 },
];

const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(176 73% 60%)',
    'hsl(24 95% 70%)',
    'hsl(280 65% 60%)',
];

export function FinancePaymentSplit() {
    return (
        <ChartCard title="Розподіл оплат за методами">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={paymentData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {paymentData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                            }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>

                <div className="flex flex-col gap-3">
                    {paymentData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-sm font-medium text-foreground">{item.name}</span>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-semibold text-foreground">₴ {item.value.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground">{item.percent}%</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ChartCard>
    );
}