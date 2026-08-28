'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { staffApi, type StaffStats } from '@/lib/api/staff';
import { USE_MOCK_DATA } from '@/lib/config';
import type { Staff } from '../types';
import { Calendar, Banknote, Star, Receipt, type LucideIcon } from 'lucide-react';

interface StaffStatisticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: Staff | null;
}

const MOCK_STATS: StaffStats = { visits: 87, revenue: 125400, avgCheck: 1441, rating: 4.8 };

export function StaffStatisticsModal({ isOpen, onClose, staff }: StaffStatisticsModalProps) {
    const [stats, setStats] = useState<StaffStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !staff) return;
        if (USE_MOCK_DATA) {
            setStats(MOCK_STATS);
            return;
        }
        setIsLoading(true);
        staffApi
            .getStats(String(staff.id))
            .then(setStats)
            .catch((err) => console.error('Failed to load staff stats:', err))
            .finally(() => setIsLoading(false));
    }, [isOpen, staff]);

    if (!staff) return null;

    const StatCard = ({
        icon: Icon,
        label,
        value,
        suffix = '',
    }: {
        icon: LucideIcon;
        label: string;
        value: string | number;
        suffix?: string;
    }) => (
        <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold text-foreground">
                        {value}
                        {suffix}
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Статистика: ${staff.firstName}`} size="lg">
            <div className="space-y-6">
                {isLoading || !stats ? (
                    <div className="flex justify-center py-12">
                        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard
                            icon={Banknote}
                            label="Виручка (завершені візити)"
                            value={stats.revenue.toLocaleString('uk-UA')}
                            suffix=" ₴"
                        />
                        <StatCard icon={Calendar} label="Завершених візитів" value={stats.visits} />
                        <StatCard
                            icon={Receipt}
                            label="Середній чек"
                            value={stats.avgCheck.toLocaleString('uk-UA')}
                            suffix=" ₴"
                        />
                        <StatCard
                            icon={Star}
                            label="Середній рейтинг"
                            value={stats.rating !== null ? stats.rating : '—'}
                        />
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <Button variant="secondary" onClick={onClose}>
                        Закрити
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
