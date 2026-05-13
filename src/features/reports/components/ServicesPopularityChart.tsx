'use client';

import { DonutChart } from '@/shared/components/ui';

const data = [
    { name: 'Перукарські', value: 45 },
    { name: 'Манікюр/Педикюр', value: 30 },
    { name: 'Косметологія', value: 15 },
    { name: 'Візаж', value: 10 },
];

export function ServicesPopularityChart() {
    return (
        <DonutChart
            title="Популярність послуг"
            subtitle="Розподіл за категоріями"
            data={data}
            valueSuffix="%"
            totalLabel="Всього"
            totalValue={100}
            className="h-full"
        />
    );
}
