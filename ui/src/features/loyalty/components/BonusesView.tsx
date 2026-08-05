'use client';

import { useMemo, useState } from 'react';
import { Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Button } from '@/shared/components/ui/Button';
import { mockBonusPrograms } from '../data/mockLoyalty';
import type { BonusProgram } from '../types';

import { useToast } from '@/shared/hooks/useToast';

interface BonusesViewProps {
    searchQuery: string;
    onEdit: (bonus: BonusProgram) => void;
}

export function BonusesView({ searchQuery, onEdit }: BonusesViewProps) {
    const toast = useToast();
    const [bonuses, setBonuses] = useState(mockBonusPrograms);

    const filteredBonuses = useMemo(() => {
        if (!searchQuery) return bonuses;

        const query = searchQuery.toLowerCase();
        return bonuses.filter(
            (bonus) =>
                bonus.name.toLowerCase().includes(query) ||
                bonus.description.toLowerCase().includes(query),
        );
    }, [searchQuery, bonuses]);

    const handleToggleActive = (bonus: BonusProgram) => {
        setBonuses((prev) =>
            prev.map((b) => (b.id === bonus.id ? { ...b, isActive: !b.isActive } : b)),
        );
        toast.success(`Бонусну програму ${!bonus.isActive ? 'увімкнено' : 'вимкнено'}`);
    };

    const handleDelete = (bonus: BonusProgram) => {
        setBonuses((prev) => prev.filter((b) => b.id !== bonus.id));
        toast.success('Бонусну програму видалено');
    };

    if (filteredBonuses.length === 0) {
        return (
            <EmptyState
                title="Бонусних програм не знайдено"
                description={
                    searchQuery
                        ? 'Спробуйте змінити параметри пошуку'
                        : 'Створіть першу бонусну програму'
                }
            />
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBonuses.map((bonus) => (
                <Card key={bonus.id} className="p-5 transition-shadow hover:shadow-md">
                    <div className="mb-3 flex items-start justify-between">
                        <div className="min-w-0 flex-1 pr-4">
                            <h3 className="truncate font-semibold text-foreground">{bonus.name}</h3>
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {bonus.description}
                            </p>
                        </div>
                        <Badge variant={bonus.isActive ? 'success' : 'default'}>
                            {bonus.isActive ? 'Активна' : 'Неактивна'}
                        </Badge>
                    </div>

                    <div className="mb-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Кешбек:</span>
                            <span className="font-medium text-primary">
                                {bonus.percentCashback}%
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Мін. сума покупки:</span>
                            <span className="font-medium">
                                {bonus.minPurchaseAmount > 0
                                    ? `${bonus.minPurchaseAmount} ₴`
                                    : 'Немає'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-border pt-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(bonus)}
                            leftIcon={
                                bonus.isActive ? (
                                    <ToggleRight size={16} className="text-success" />
                                ) : (
                                    <ToggleLeft size={16} />
                                )
                            }
                        >
                            <span className="hidden sm:inline">
                                {bonus.isActive ? 'Активна' : 'Увімкнути'}
                            </span>
                        </Button>
                        <div className="flex-1" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(bonus)}
                            className="px-2"
                        >
                            <Pencil size={16} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(bonus)}
                            className="px-2 hover:bg-destructive/10 hover:text-destructive"
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
}
