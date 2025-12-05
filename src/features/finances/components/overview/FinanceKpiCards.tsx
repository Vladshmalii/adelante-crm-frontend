import { Card } from '@/shared/components/ui/Card';

interface KpiCardProps {
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
}

function KpiCard({ label, value, change, trend }: KpiCardProps) {
    return (
        <Card className="p-6 hover:shadow-md transition-shadow">
            <p className="text-sm text-muted-foreground mb-2">{label}</p>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-bold font-heading">{value}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend === 'up'
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-red-500/10 text-red-600'
                    }`}>
                    {change}
                </span>
            </div>
        </Card>
    );
}

function FinanceKpiCards() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
                label="Дохід за період"
                value="42 350 ₴"
                change="+12% до минулого тижня"
                trend="up"
            />
            <KpiCard
                label="Середній чек"
                value="1 285 ₴"
                change="-3% до минулого тижня"
                trend="down"
            />
            <KpiCard
                label="Кількість оплат"
                value="33"
                change="+18% до минулого тижня"
                trend="up"
            />
            <KpiCard
                label="Онлайн-оплати"
                value="8 100 ₴"
                change="+22% до минулого тижня"
                trend="up"
            />
        </div>
    );
}

export default FinanceKpiCards;