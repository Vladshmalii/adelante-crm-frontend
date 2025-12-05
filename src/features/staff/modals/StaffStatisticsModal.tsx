'use client';

import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import type { Staff } from '../types';
import { TrendingUp, TrendingDown, Users, Calendar, Banknote, Star, Clock, Award } from 'lucide-react';

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
    const maxRevenue = Math.max(...stats.revenueByMonth.map(m => m.value));

    const StatCard = ({
        icon: Icon,
        label,
        value,
        change,
        suffix = ''
    }: {
        icon: any;
        label: string;
        value: string | number;
        change?: number;
        suffix?: string;
    }) => (
        <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold text-foreground">
                        {value}{suffix}
                    </p>
                </div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{change >= 0 ? '+' : ''}{change}%</span>
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
                    <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Середній час послуги</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">{stats.averageServiceTime} хв</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Award className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Виконання записів</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">{stats.completionRate}%</p>
                    </div>
                </div>

                {/* Revenue Chart */}
                <div className="bg-card border border-border rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-4">Виручка по місяцях</h4>
                    <div className="flex items-end gap-2 h-32">
                        {stats.revenueByMonth.map((month, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                    className="w-full bg-primary/20 rounded-t transition-all hover:bg-primary/30"
                                    style={{ height: `${(month.value / maxRevenue) * 100}%` }}
                                >
                                    <div
                                        className="w-full bg-primary rounded-t"
                                        style={{ height: `${(month.value / maxRevenue) * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground">{month.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Services */}
                <div className="bg-card border border-border rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Топ послуги</h4>
                    <div className="space-y-3">
                        {stats.topServices.map((service, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{service.name}</p>
                                        <p className="text-xs text-muted-foreground">{service.count} записів</p>
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
