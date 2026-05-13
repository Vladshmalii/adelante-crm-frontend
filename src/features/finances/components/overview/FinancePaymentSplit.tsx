import { DonutChart } from '@/shared/components/ui';

const paymentData = [
    { name: 'Готівка', value: 12800, percent: 30.2 },
    { name: 'Картка', value: 18450, percent: 43.6 },
    { name: 'Онлайн', value: 8100, percent: 19.1 },
    { name: 'Сертифікати', value: 2000, percent: 4.7 },
    { name: 'Бонуси', value: 1000, percent: 2.4 },
];

export function FinancePaymentSplit() {
    return (
        <DonutChart
            title="Розподіл оплат за методами"
            data={paymentData}
            valuePrefix="₴ "
            totalLabel="Всього"
            className="h-full"
        />
    );
}