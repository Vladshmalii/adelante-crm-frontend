'use client';

import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import type { Staff } from '../types';
import {
    TrendingUp,
    TrendingDown,
    Users,
    Calendar,
    Banknote,
    Star,
    Clock,
    Award,
} from 'lucide-react';

interface StaffStatisticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: Staff | null;
}

// Mock statistics data
const getMockStatistics = (staff: Staff) => ({
    totalRevenue: 125400,
    revenueChange: 12.5,
    appointmentsCount: 87,
    appointmentsChange: -3.2,
    averageRating: 4.8,
    ratingChange: 0.2,
    clientsServed: 45,
    clientsChange: 8.1,
    averageServiceTime: 45,
    completionRate: 94,
    topServices: [
        { name: 'Стрижка чоловіча', count: 32, revenue: 28800 },
        { name: 'Стрижка + борода', count: 24, revenue: 31200 },
        { name: 'Фарбування', count: 18, revenue: 43200 },
        { name: 'Укладка', count: 13, revenue: 9100 },
    ],
    revenueByMonth: [
        { month: 'Лип', value: 18500 },
        { month: 'Сер', value: 22300 },
        { month: 'Вер', value: 19800 },
        { month: 'Жов', value: 24100 },
        { month: 'Лис', value: 21200 },
        { month: 'Гру', value: 19500 },
    ],
});

export function StaffStatisticsModal({ isOpen, onClose, staff }: StaffStatisticsModalProps) {
    if (!staff) return null;

    const stats = getMockStatistics(staff);
    const maxRevenue = Math.max(...stats.revenueByMonth.map((m) => m.value));

    const StatCard = ({
        icon: Icon,
        label,
        value,
        change,
        suffix = '',
    }: {
        icon: any;
        label: string;
        value: string | number;
        change?: number;
        suffix?: string;
    }) => (
        <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold text-foreground">
                        {value}
                        {suffix}
                    </p>
                </div>
                {change !== undefined && (
                    <div
                        className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}
                    >
                        {change >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                        ) : (
                            <TrendingDown className="h-4 w-4" />
                        )}
                        <span>
                            {change >= 0 ? '+' : ''}
                            {change}%
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Статистика: ${staff.firstName}`} size="lg">
            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <StatCard
                        icon={Banknote}
                        label="Виручка за місяць"
                        value={stats.totalRevenue.toLocaleString('uk-UA')}
                        suffix=" ₴"
                        change={stats.revenueChange}
                    />
                    <StatCard
                        icon={Calendar}
                        label="Записів за місяць"
                        value={stats.appointmentsCount}
                        change={stats.appointmentsChange}
                    />
                    <StatCard
                        icon={Star}
                        label="Середній рейтинг"
                        value={stats.averageRating}
                        change={stats.ratingChange}
                    />
                    <StatCard
                        icon={Users}
                        label="Обслужено клієнтів"
                        value={stats.clientsServed}
                        change={stats.clientsChange}
                    />
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-muted/30 p-4">
                        <div className="mb-1 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                Середній час послуги
                            </span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                            {stats.averageServiceTime} хв
                        </p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-4">
                        <div className="mb-1 flex items-center gap-2">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Виконання записів</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                            {stats.completionRate}%
                        </p>
                    </div>
                </div>

                {/* Revenue Chart */}
                <div className="rounded-lg border border-border bg-card p-4">
                    <h4 className="mb-4 text-sm font-semibold text-foreground">
                        Виручка по місяцях
                    </h4>
                    <div className="flex h-32 items-end gap-2">
                        {stats.revenueByMonth.map((month, index) => (
                            <div key={index} className="flex flex-1 flex-col items-center gap-1">
                                <div
                                    className="w-full rounded-t bg-primary/20 transition-all hover:bg-primary/30"
                                    style={{ height: `${(month.value / maxRevenue) * 100}%` }}
                                >
                                    <div
                                        className="w-full rounded-t bg-primary"
                                        style={{ height: `${(month.value / maxRevenue) * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground">{month.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Services */}
                <div className="rounded-lg border border-border bg-card p-4">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">Топ послуги</h4>
                    <div className="space-y-3">
                        {stats.topServices.map((service, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            {service.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {service.count} записів
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                    {service.revenue.toLocaleString('uk-UA')} ₴
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-2">
                    <Button variant="secondary" onClick={onClose}>
                        Закрити
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
