'use client';

import { useMemo } from 'react';
import { Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { mockBonusPrograms } from '../data/mockLoyalty';
import type { BonusProgram } from '../types';

interface BonusesViewProps {
    searchQuery: string;
    onEdit: (bonus: BonusProgram) => void;
}

export function BonusesView({ searchQuery, onEdit }: BonusesViewProps) {
    const filteredBonuses = useMemo(() => {
        if (!searchQuery) return mockBonusPrograms;

        const query = searchQuery.toLowerCase();
        return mockBonusPrograms.filter(
            (bonus) =>
                bonus.name.toLowerCase().includes(query) ||
                bonus.description.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const handleToggleActive = (bonus: BonusProgram) => {
        console.log('Toggle active:', bonus.id);
    };

    const handleDelete = (bonus: BonusProgram) => {
        console.log('Delete bonus:', bonus.id);
    };

    if (filteredBonuses.length === 0) {
        return (
            <EmptyState
                title="Бонусних програм не знайдено"
                description={searchQuery ? 'Спробуйте змінити параметри пошуку' : 'Створіть першу бонусну програму'}
            />
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBonuses.map((bonus) => (
                <Card key={bonus.id} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0 pr-4">
                            <h3 className="font-semibold text-foreground truncate">{bonus.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {bonus.description}
                            </p>
                        </div>
                        <Badge variant={bonus.isActive ? 'success' : 'default'}>
                            {bonus.isActive ? 'Активна' : 'Неактивна'}
                        </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Кешбек:</span>
                            <span className="font-medium text-primary">{bonus.percentCashback}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Мін. сума покупки:</span>
                            <span className="font-medium">
                                {bonus.minPurchaseAmount > 0 ? `${bonus.minPurchaseAmount} ₴` : 'Немає'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                        <button
                            onClick={() => handleToggleActive(bonus)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                        >
                            {bonus.isActive ? (
                                <>
                                    <ToggleRight size={16} className="text-success" />
                                    <span className="hidden sm:inline">Активна</span>
                                </>
                            ) : (
                                <>
                                    <ToggleLeft size={16} />
                                    <span className="hidden sm:inline">Увімкнути</span>
                                </>
                            )}
                        </button>
                        <div className="flex-1" />
                        <button
                            onClick={() => onEdit(bonus)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                        >
                            <Pencil size={16} />
                        </button>
                        <button
                            onClick={() => handleDelete(bonus)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </Card>
            ))}
        </div>
    );
}
