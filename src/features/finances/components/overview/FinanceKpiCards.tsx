import { TrendingUp, Banknote, CreditCard, Globe, Receipt, Hash, type LucideIcon } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';

interface KpiCardProps {
    icon: LucideIcon;
    label: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
}

function KpiCard({ icon: Icon, label, value, trend, trendUp }: KpiCardProps) {
    return (
        <Card>
            <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Icon size={20} />
                    </div>
                    <span className="text-sm text-muted-foreground">{label}</span>
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
                {trend && (
                    <div className={`text-xs flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp size={12} className={trendUp ? '' : 'rotate-180'} />
                        {trend}
                    </div>
                )}
            </div>
        </Card>
    );
}

function FinanceKpiCards() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard
                icon={TrendingUp}
                label="Дохід за період"
                value="₴ 42,350"
                trend="+12% до минулого тижня"
                trendUp={true}
            />
            <KpiCard
                icon={Banknote}
                label="Оплачено готівкою"
                value="₴ 12,800"
                trend="+8% до минулого тижня"
                trendUp={true}
            />
            <KpiCard
                icon={CreditCard}
                label="Оплачено карткою"
                value="₴ 18,450"
                trend="+15% до минулого тижня"
                trendUp={true}
            />
            <KpiCard
                icon={Globe}
                label="Онлайн-оплати"
                value="₴ 8,100"
                trend="+22% до минулого тижня"
                trendUp={true}
            />
            <KpiCard
                icon={Receipt}
                label="Середній чек"
                value="₴ 1,285"
                trend="-3% до минулого тижня"
                trendUp={false}
            />
            <KpiCard
                icon={Hash}
                label="Кількість оплат"
                value="33"
                trend="+18% до минулого тижня"
                trendUp={true}
            />
        </div>
    );
}

export default FinanceKpiCards