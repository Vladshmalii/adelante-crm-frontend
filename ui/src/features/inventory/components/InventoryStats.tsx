import { Package, AlertTriangle, XCircle, Banknote } from 'lucide-react';
import { Progress } from '@/shared/components/ui/Progress';
import { Product } from '../types';

interface InventoryStatsProps {
    products: Product[];
}

export function InventoryStats({ products }: InventoryStatsProps) {
    const totalItems = products.length;
    const lowStockItems = products.filter(
        (p) => p.quantity > 0 && p.quantity <= p.minQuantity,
    ).length;
    const outOfStockItems = products.filter((p) => p.quantity === 0).length;

    // Приблизна оцінка вартості складу (собівартість * кількість)
    // Для вагових товарів це теж працює коректно, якщо costPrice за одиницю виміру
    const totalValue = products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

    const lowStockPercentage = totalItems > 0 ? (lowStockItems / totalItems) * 100 : 0;
    const outOfStockPercentage = totalItems > 0 ? (outOfStockItems / totalItems) * 100 : 0;

    const stats = [
        {
            label: 'Всього позицій',
            value: totalItems,
            icon: Package,
            color: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-900/20',
        },
        {
            label: 'Закінчуються',
            value: lowStockItems,
            icon: AlertTriangle,
            color: 'text-orange-600',
            bg: 'bg-orange-100 dark:bg-orange-900/20',
        },
        {
            label: 'Немає в наявності',
            value: outOfStockItems,
            icon: XCircle,
            color: 'text-red-600',
            bg: 'bg-red-100 dark:bg-red-900/20',
        },
        {
            label: 'Вартість складу',
            value: `${totalValue.toLocaleString('uk-UA')} ₴`,
            icon: Banknote,
            color: 'text-green-600',
            bg: 'bg-green-100 dark:bg-green-900/20',
        },
    ];

    return (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                const showProgress = index === 1 || index === 2;
                const progressValue =
                    index === 1 ? lowStockPercentage : index === 2 ? outOfStockPercentage : 0;
                const progressColor = index === 1 ? 'warning' : index === 2 ? 'danger' : 'primary';

                return (
                    <div
                        key={index}
                        className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`rounded-full p-3 ${stat.bg}`}>
                                <Icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                                <p className="font-heading text-xl font-bold text-foreground">
                                    {stat.value}
                                </p>
                            </div>
                        </div>
                        {showProgress && totalItems > 0 && (
                            <Progress
                                value={progressValue}
                                size="sm"
                                color={progressColor}
                                showLabel={false}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
