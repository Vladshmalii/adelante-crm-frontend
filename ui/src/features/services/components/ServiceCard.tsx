'use client';

import { Badge } from '@/shared/components/ui/Badge';
import type { Service } from '../types';
import { Clock, MoreHorizontal, Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface ServiceCardProps {
    service: Service;
    onClick: () => void;
}

export function ServiceCard({ service, onClick }: ServiceCardProps) {
    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            hair: 'Волосся',
            nails: 'Нігті',
            face: 'Обличчя',
            body: 'Тіло',
            makeup: 'Макіяж',
            other: 'Інше',
        };
        return labels[category] || category;
    };

    const getStatusVariant = (status: string): 'success' | 'warning' | 'default' => {
        const variants: Record<string, 'success' | 'warning' | 'default'> = {
            active: 'success',
            inactive: 'warning',
            archived: 'default',
        };
        return variants[status] || 'default';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            active: 'Активна',
            inactive: 'Неактивна',
            archived: 'Архівована',
        };
        return labels[status] || status;
    };

    const status = (service as any).status ?? (service.isActive ? 'active' : 'inactive');

    // Використовуємо колір послуги для акцентів, якщо він є
    const accentColor = service.color || '#10b981';

    return (
        <div
            onClick={onClick}
            className={clsx(
                'group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card p-3.5',
                'transition-all duration-500 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5',
                'flex h-full animate-fade-in flex-col',
            )}
        >
            {/* Декоративний фон для кольору */}
            <div
                className="absolute right-0 top-0 -mr-10 -mt-10 h-20 w-20 opacity-[0.03] transition-opacity duration-500 group-hover:opacity-[0.08]"
                style={{ backgroundColor: accentColor, borderRadius: '100%' }}
            />

            <div className="relative z-10 mb-2.5 flex items-start justify-between">
                <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                >
                    <Sparkles size={18} />
                </div>
                <Badge
                    variant={getStatusVariant(status)}
                    className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider shadow-sm"
                >
                    {getStatusLabel(status)}
                </Badge>
            </div>

            <div className="relative z-10 flex-1">
                <div className="mb-1 flex items-center gap-2">
                    <Badge
                        variant="default"
                        className="rounded-md bg-secondary/80 px-1.5 py-0.5 text-[8px] font-bold uppercase text-muted-foreground"
                    >
                        {getCategoryLabel(service.category)}
                    </Badge>
                </div>
                <h3 className="font-heading text-sm font-bold leading-tight text-foreground transition-colors duration-300 group-hover:text-primary">
                    {service.name}
                </h3>

                {service.description && (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground opacity-80 transition-opacity group-hover:opacity-100">
                        {service.description}
                    </p>
                )}
            </div>

            <div className="relative z-10 mt-3.5 flex items-center justify-between border-t border-border/50 pt-2.5">
                <div className="flex items-center gap-1 rounded-full bg-secondary/50 px-2 py-1 text-muted-foreground transition-colors group-hover:bg-primary/5 group-hover:text-primary">
                    <Clock className="h-3 w-3" />
                    <span className="text-[10px] font-bold">{service.duration} хв</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground opacity-60">
                        Вартість
                    </span>
                    <span className="text-lg font-black tracking-tight text-foreground">
                        ₴ {service.price.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Hover Indicator */}
            <div
                className="absolute bottom-0 left-0 h-1 rounded-full bg-primary transition-all duration-500"
                style={{ width: '0%', backgroundColor: accentColor }}
                id="hover-bar"
            />
            <style jsx>{`
                div:hover #hover-bar {
                    width: 100%;
                }
            `}</style>
        </div>
    );
}
