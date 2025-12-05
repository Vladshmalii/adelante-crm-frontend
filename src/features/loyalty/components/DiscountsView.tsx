'use client';

import { useMemo } from 'react';
import { Pencil, Trash2, Copy, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Progress } from '@/shared/components/ui/Progress';
import { useToast } from '@/shared/hooks/useToast';
import { mockDiscounts } from '../data/mockLoyalty';
import type { Discount } from '../types';

interface DiscountsViewProps {
    searchQuery: string;
    onEdit: (discount: Discount) => void;
}

export function DiscountsView({ searchQuery, onEdit }: DiscountsViewProps) {
    const toast = useToast();

    const filteredDiscounts = useMemo(() => {
        if (!searchQuery) return mockDiscounts;

        const query = searchQuery.toLowerCase();
        return mockDiscounts.filter(
            (discount) =>
                discount.name.toLowerCase().includes(query) ||
                discount.code?.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success('Код скопійовано');
    };

    const handleToggleActive = (discount: Discount) => {
        console.log('Toggle active:', discount.id);
    };

    const handleDelete = (discount: Discount) => {
        console.log('Delete discount:', discount.id);
    };

    const getDiscountStatus = (discount: Discount) => {
        const now = new Date();
        const validTo = new Date(discount.validTo);
        const validFrom = new Date(discount.validFrom);

        if (!discount.isActive) return { label: 'Неактивна', variant: 'default' as const };
        if (now > validTo) return { label: 'Прострочена', variant: 'danger' as const };
        if (now < validFrom) return { label: 'Очікує', variant: 'warning' as const };
        if (discount.maxUses && discount.currentUses >= discount.maxUses) {
            return { label: 'Вичерпана', variant: 'default' as const };
        }
        return { label: 'Активна', variant: 'success' as const };
    };

    if (filteredDiscounts.length === 0) {
        return (
            <EmptyState
                title="Знижок не знайдено"
                description={searchQuery ? 'Спробуйте змінити параметри пошуку' : 'Створіть першу знижку'}
            />
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDiscounts.map((discount) => {
                const status = getDiscountStatus(discount);
                const usagePercent = discount.maxUses
                    ? (discount.currentUses / discount.maxUses) * 100
                    : 0;

                return (
                    <Card key={discount.id} className="p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0 pr-4">
                                <h3 className="font-semibold text-foreground truncate">{discount.name}</h3>
                                {discount.code && (
                                    <button
                                        onClick={() => handleCopyCode(discount.code!)}
                                        className="flex items-center gap-1.5 mt-1.5 text-sm text-primary hover:text-primary-hover transition-colors group"
                                    >
                                        <code className="px-2 py-0.5 bg-primary/10 rounded font-mono">
                                            {discount.code}
                                        </code>
                                        <Copy size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                )}
                            </div>
                            <Badge variant={status.variant}>{status.label}</Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Знижка:</span>
                                <span className="font-medium text-primary">
                                    {discount.type === 'percentage'
                                        ? `${discount.value}%`
                                        : `${discount.value} ₴`
                                    }
                                </span>
                            </div>
                            {discount.minOrderAmount && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Мін. замовлення:</span>
                                    <span className="font-medium">{discount.minOrderAmount} ₴</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Дійсна до:</span>
                                <span className="font-medium">
                                    {new Date(discount.validTo).toLocaleDateString('uk-UA')}
                                </span>
                            </div>
                            {discount.maxUses && (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Використань:</span>
                                        <span className="font-medium">
                                            {discount.currentUses} / {discount.maxUses}
                                        </span>
                                    </div>
                                    <Progress value={usagePercent} size="sm" />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-border">
                            <button
                                onClick={() => handleToggleActive(discount)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                            >
                                {discount.isActive ? (
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
                                onClick={() => onEdit(discount)}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                            >
                                <Pencil size={16} />
                            </button>
                            <button
                                onClick={() => handleDelete(discount)}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
