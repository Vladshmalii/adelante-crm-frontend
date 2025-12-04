'use client';

import { Badge } from '@/shared/components/ui/Badge';
import type { Service } from '../types';
import { Clock } from 'lucide-react';
import clsx from 'clsx';

interface ServiceCardProps {
    service: Service;
    onClick: () => void;
}

export function ServiceCard({ service, onClick }: ServiceCardProps) {
    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            'hair': 'Волосся',
            'nails': 'Нігті',
            'face': 'Обличчя',
            'body': 'Тіло',
            'makeup': 'Макіяж',
            'other': 'Інше'
        };
        return labels[category] || category;
    };

    const getStatusVariant = (status: string): 'success' | 'warning' | 'default' => {
        const variants: Record<string, 'success' | 'warning' | 'default'> = {
            'active': 'success',
            'inactive': 'warning',
            'archived': 'default'
        };
        return variants[status] || 'default';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'active': 'Активна',
            'inactive': 'Неактивна',
            'archived': 'Архівована'
        };
        return labels[status] || status;
    };

    return (
        <div
            onClick={onClick}
            className={clsx(
                'p-4 rounded-lg border border-border bg-card cursor-pointer',
                'transition-all duration-200 hover:shadow-md hover:border-primary/50',
                'animate-fade-in'
            )}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground font-heading mb-1">
                        {service.name}
                    </h3>
                    <Badge variant="primary" size="sm">
                        {getCategoryLabel(service.category)}
                    </Badge>
                </div>
                <Badge variant={getStatusVariant(service.status)} size="sm">
                    {getStatusLabel(service.status)}
                </Badge>
            </div>

            {service.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {service.description}
                </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration} хв</span>
                </div>
                <div className="flex items-center text-lg font-semibold text-foreground">
                    <span>{service.price} ₴</span>
                </div>
            </div>
        </div>
    );
}
