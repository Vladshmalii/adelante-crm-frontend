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

    const status = (service as any).status ?? (service.isActive ? 'active' : 'inactive');
    
    // Використовуємо колір послуги для акцентів, якщо він є
    const accentColor = service.color || '#10b981';

    return (
        <div
            onClick={onClick}
            className={clsx(
                'group relative p-3.5 rounded-2xl border border-border bg-card cursor-pointer overflow-hidden',
                'transition-all duration-500 ease-out hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30',
                'animate-fade-in flex flex-col h-full'
            )}
        >
            {/* Декоративний фон для кольору */}
            <div 
                className="absolute top-0 right-0 w-20 h-20 -mr-10 -mt-10 opacity-[0.03] transition-opacity duration-500 group-hover:opacity-[0.08]"
                style={{ backgroundColor: accentColor, borderRadius: '100%' }}
            />

            <div className="flex items-start justify-between mb-2.5 relative z-10">
                <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                >
                    <Sparkles size={18} />
                </div>
                <Badge variant={getStatusVariant(status)} className="font-black uppercase text-[8px] px-1.5 py-0.5 tracking-wider shadow-sm">
                    {getStatusLabel(status)}
                </Badge>
            </div>

            <div className="flex-1 relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <Badge variant="default" className="bg-secondary/80 text-muted-foreground font-bold text-[8px] uppercase px-1.5 py-0.5 rounded-md">
                        {getCategoryLabel(service.category)}
                    </Badge>
                </div>
                <h3 className="text-sm font-bold text-foreground font-heading leading-tight group-hover:text-primary transition-colors duration-300">
                    {service.name}
                </h3>
                
                {service.description && (
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                        {service.description}
                    </p>
                )}
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-border/50 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-1 py-1 px-2 rounded-full bg-secondary/50 text-muted-foreground transition-colors group-hover:bg-primary/5 group-hover:text-primary">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-bold">{service.duration} хв</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">Вартість</span>
                    <span className="text-lg font-black text-foreground tracking-tight">
                        ₴ {service.price.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Hover Indicator */}
            <div 
                className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-500 rounded-full"
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
