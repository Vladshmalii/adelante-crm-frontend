import { Card } from '@/shared/components/ui/Card';

interface KpiCardProps {
    label: string;
    value: string;
}

function KpiCard({ label, value }: KpiCardProps) {
    return (
        <Card className="p-4 hover:shadow-md transition-shadow">
            <p className="text-sm text-muted-foreground mb-2">{label}</p>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-bold font-heading">{value}</span>
            </div>
        </Card>
    );
}

interface FinanceKpiCardsProps {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
}

function formatUAH(value: number) {
    return `${value.toLocaleString('uk-UA')} ₴`;
}

function FinanceKpiCards({ totalRevenue, totalExpenses, netIncome }: FinanceKpiCardsProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <KpiCard label="Дохід за період" value={formatUAH(totalRevenue)} />
            <KpiCard label="Витрати за період" value={formatUAH(totalExpenses)} />
            <KpiCard label="Чистий прибуток" value={formatUAH(netIncome)} />
        </div>
    );
}

export default FinanceKpiCards;
