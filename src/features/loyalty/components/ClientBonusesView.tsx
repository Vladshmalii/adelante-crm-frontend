'use client';

import { useMemo } from 'react';
import { Star, TrendingUp } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { mockClientBonuses } from '../data/mockLoyalty';
import { LOYALTY_LEVELS } from '../constants';
import type { ClientBonus } from '../types';

interface ClientBonusesViewProps {
    searchQuery: string;
}

export function ClientBonusesView({ searchQuery }: ClientBonusesViewProps) {
    const filteredClients = useMemo(() => {
        if (!searchQuery) return mockClientBonuses;

        const query = searchQuery.toLowerCase();
        return mockClientBonuses.filter(
            (client) => client.clientName.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    if (filteredClients.length === 0) {
        return (
            <EmptyState
                title="Клієнтів не знайдено"
                description={searchQuery ? 'Спробуйте змінити параметри пошуку' : 'Клієнти з бонусами зʼявляться тут'}
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4 mb-6">
                {Object.entries(LOYALTY_LEVELS).map(([key, level]) => {
                    const count = mockClientBonuses.filter(c => c.level === key).length;
                    return (
                        <Card key={key} className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${level.color} flex items-center justify-center`}>
                                    <Star size={20} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{level.name}</p>
                                    <p className="text-xl font-bold">{count}</p>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-left p-4 font-medium text-muted-foreground">Клієнт</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Рівень</th>
                                <th className="text-right p-4 font-medium text-muted-foreground">Всього балів</th>
                                <th className="text-right p-4 font-medium text-muted-foreground">Доступно</th>
                                <th className="text-right p-4 font-medium text-muted-foreground">Використано</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map((client) => {
                                const levelInfo = LOYALTY_LEVELS[client.level];
                                return (
                                    <tr key={client.clientId} className="border-b border-border hover:bg-muted/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-primary font-medium">
                                                        {client.clientName.charAt(0)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{client.clientName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${levelInfo.color} text-white`}>
                                                {levelInfo.name}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <TrendingUp size={14} className="text-primary" />
                                                <span className="font-medium">{client.totalPoints.toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="font-medium text-success">
                                                {client.availablePoints.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="text-muted-foreground">
                                                {client.usedPoints.toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
