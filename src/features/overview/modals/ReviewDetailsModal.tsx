'use client';

import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Review } from '../types';
import { Star, User, Phone, Calendar, MessageSquare, Quote, MessageCircle, ArrowUpRight } from 'lucide-react';
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
                <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                            {review.clientName.charAt(0)}
                        </div>
                        <div>
                            <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1.5">Клієнт</div>
                            <div className="text-base font-bold text-foreground leading-none">{review.clientName}</div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Рейтинг</div>
                        <div className="flex items-center gap-1 bg-background px-3 py-1.5 rounded-xl border border-border/50 shadow-sm">
                            <span className="text-sm font-black text-foreground mr-1">{review.rating}.0</span>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    size={14}
                                    className={clsx(
                                        i < review.rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-muted-foreground/30'
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-card rounded-2xl border border-border/50 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground">
                                <Phone size={20} />
                            </div>
                            <div>
                                <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">Телефон</div>
                                <div className="text-sm font-medium text-foreground/80">{review.phone}</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-card rounded-2xl border border-border/50 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <User size={20} />
                            </div>
                            <div>
                                <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">Майстер</div>
                                <div className="text-sm font-bold text-foreground">{review.employee}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Review Text */}
                <div className="p-6 bg-card rounded-2xl border border-border/50 relative overflow-hidden">
                    <Quote className="absolute -top-4 -right-4 text-primary/5 w-24 h-24 rotate-12" />
                    <div className="relative z-10">
                        <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 mb-3 flex items-center gap-2">
                            <MessageSquare size={14} />
                            Відгук клієнта
                        </div>
                        <div className="text-lg font-medium text-foreground/90 leading-relaxed italic">
                            {review.text ? `"${review.text}"` : 'Клієнт не залишив текстового коментаря'}
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar size={12} />
                            {formatDate(review.date)}
                        </div>
                    </div>
                </div>

                {/* Quick Contact */}
                <div className="space-y-3">
                    <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Зв'язок з клієнтом</div>
                    <div className="flex gap-3">
                        <Button variant="secondary" className="flex-1 gap-2 rounded-xl h-12 text-sm font-bold">
                            <MessageCircle size={18} className="text-[#24A1DE]" />
                            Telegram
                        </Button>
                        <Button variant="secondary" className="flex-1 gap-2 rounded-xl h-12 text-sm font-bold">
                            <div className="w-5 h-5 bg-[#25D366] rounded-full flex items-center justify-center">
                                <Phone size={12} className="text-white" />
                            </div>
                            WhatsApp
                        </Button>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                    <Button type="button" variant="primary" onClick={onClose} className="rounded-xl px-8 h-12 font-bold">
                        Закрити
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
