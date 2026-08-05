'use client';

import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Review } from '../types';
import {
    Star,
    User,
    Phone,
    Calendar,
    MessageSquare,
    Quote,
    MessageCircle,
    ArrowUpRight,
} from 'lucide-react';
import clsx from 'clsx';

interface ReviewDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    review: Review | null;
}

export function ReviewDetailsModal({ isOpen, onClose, review }: ReviewDetailsModalProps) {
    if (!review) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Деталі відгуку" size="md">
            <div className="space-y-6">
                {/* Client Header */}
                <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-secondary/10 p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                            {review.clientName.charAt(0)}
                        </div>
                        <div>
                            <div className="mb-1.5 text-[11px] font-black uppercase leading-none tracking-widest text-muted-foreground/60">
                                Клієнт
                            </div>
                            <div className="text-base font-bold leading-none text-foreground">
                                {review.clientName}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="mb-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                            Рейтинг
                        </div>
                        <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-background px-3 py-1.5 shadow-sm">
                            <span className="mr-1 text-sm font-black text-foreground">
                                {review.rating}.0
                            </span>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    size={14}
                                    className={clsx(
                                        i < review.rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-muted-foreground/30',
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-3 rounded-2xl border border-border/50 bg-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground">
                                <Phone size={20} />
                            </div>
                            <div>
                                <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                                    Телефон
                                </div>
                                <div className="text-sm font-medium text-foreground/80">
                                    {review.phone}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-border/50 bg-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <User size={20} />
                            </div>
                            <div>
                                <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                                    Майстер
                                </div>
                                <div className="text-sm font-bold text-foreground">
                                    {review.employee}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Review Text */}
                <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6">
                    <Quote className="absolute -right-4 -top-4 h-24 w-24 rotate-12 text-primary/5" />
                    <div className="relative z-10">
                        <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                            <MessageSquare size={14} />
                            Відгук клієнта
                        </div>
                        <div className="text-lg font-medium italic leading-relaxed text-foreground/90">
                            {review.text
                                ? `"${review.text}"`
                                : 'Клієнт не залишив текстового коментаря'}
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar size={12} />
                            {formatDate(review.date)}
                        </div>
                    </div>
                </div>

                {/* Quick Contact */}
                <div className="space-y-3">
                    <div className="px-1 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                        Зв'язок з клієнтом
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            className="h-12 flex-1 gap-2 rounded-xl text-sm font-bold"
                        >
                            <MessageCircle size={18} className="text-[#24A1DE]" />
                            Telegram
                        </Button>
                        <Button
                            variant="secondary"
                            className="h-12 flex-1 gap-2 rounded-xl text-sm font-bold"
                        >
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366]">
                                <Phone size={12} className="text-white" />
                            </div>
                            WhatsApp
                        </Button>
                    </div>
                </div>

                <div className="flex justify-end border-t border-border pt-4">
                    <Button
                        type="button"
                        variant="primary"
                        onClick={onClose}
                        className="h-12 rounded-xl px-8 font-bold"
                    >
                        Закрити
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
