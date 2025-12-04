import { Users, UserCheck, UserX, Umbrella, Briefcase } from 'lucide-react';
import { Progress } from '@/shared/components/ui/Progress';
import type { Staff } from '../types';

interface StaffStatsProps {
    staff: Staff[];
}

export function StaffStats({ staff }: StaffStatsProps) {
    const total = staff.length;
    const active = staff.filter((s) => s.status === 'active').length;
    const vacation = staff.filter((s) => s.status === 'vacation').length;
    const sick = staff.filter((s) => s.status === 'sick').length;
    const fired = staff.filter((s) => s.status === 'fired').length;

    const percent = (value: number) => (total > 0 ? (value / total) * 100 : 0);

    const cards = [
        {
            label: 'Всього співробітників',
            value: total,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-900/20',
            showProgress: false,
            progressValue: 0,
            progressColor: 'primary' as const,
        },
        {
            label: 'Активні',
            value: active,
            icon: UserCheck,
            color: 'text-green-600',
            bg: 'bg-green-100 dark:bg-green-900/20',
            showProgress: true,
            progressValue: percent(active),
            progressColor: 'success' as const,
        },
        {
            label: 'У відпустці',
            value: vacation,
            icon: Umbrella,
            color: 'text-orange-600',
            bg: 'bg-orange-100 dark:bg-orange-900/20',
            showProgress: true,
            progressValue: percent(vacation),
            progressColor: 'warning' as const,
        },
        {
            label: 'Хворі / звільнені',
            value: sick + fired,
            icon: UserX,
            color: 'text-red-600',
            bg: 'bg-red-100 dark:bg-red-900/20',
            showProgress: true,
            progressValue: percent(sick + fired),
            progressColor: 'danger' as const,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div
                        key={index}
                        className="p-4 bg-card rounded-lg border border-border flex flex-col gap-3"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${card.bg}`}>
                                <Icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">{card.label}</p>
                                <p className="text-xl font-bold font-heading text-foreground">
                                    {card.value}
                                </p>
                            </div>
                        </div>
                        {card.showProgress && total > 0 && (
                            <Progress
                                value={card.progressValue}
                                size="sm"
                                color={card.progressColor}
                                showLabel={false}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
