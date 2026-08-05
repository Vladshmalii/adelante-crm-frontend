'use client';

import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Change } from '../types';
import { CHANGE_ENTITIES, CHANGE_ACTIONS } from '../constants';
import { Calendar, Clock, User, FileText, Activity, Layers } from 'lucide-react';

interface ChangeDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    change: Change | null;
}

export function ChangeDetailsModal({ isOpen, onClose, change }: ChangeDetailsModalProps) {
    if (!change) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getEntityLabel = (entity: string) => {
        return CHANGE_ENTITIES.find((e) => e.value === entity)?.label || entity;
    };

    const getActionLabel = (action: string) => {
        return CHANGE_ACTIONS.find((a) => a.value === action)?.label || action;
    };

    const getActionVariant = (action: string): any => {
        switch (action) {
            case 'created':
                return 'success';
            case 'updated':
                return 'primary';
            case 'deleted':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Деталі зміни" size="md">
            <div className="space-y-6">
                {/* Header Badge */}
                <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-secondary/20 p-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                            Тип операції
                        </span>
                        <Badge
                            variant={getActionVariant(change.action)}
                            className="text-xs font-bold uppercase"
                        >
                            {getActionLabel(change.action)}
                        </Badge>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                            Дата та час
                        </span>
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <span>{formatDate(change.date)}</span>
                            <span className="text-muted-foreground/40">•</span>
                            <span>{formatTime(change.date)}</span>
                        </div>
                    </div>
                </div>

                {/* Entity Info */}
                <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Layers size={24} />
                        </div>
                        <div>
                            <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                                Об&apos;єкт зміни
                            </div>
                            <div className="text-base font-bold text-foreground">
                                {change.entityName}
                            </div>
                            <div className="mt-0.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                                {getEntityLabel(change.entity)} ID: {change.entityId}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="space-y-3 rounded-2xl border border-border/50 bg-card p-4">
                    <div className="mb-1 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground">
                            <FileText size={18} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                            Опис змін
                        </span>
                    </div>
                    <div className="rounded-xl border border-border/30 bg-secondary/10 p-4 text-sm leading-relaxed text-foreground/80">
                        {change.details}
                    </div>
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground">
                        <User size={24} />
                    </div>
                    <div>
                        <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                            Автор зміни
                        </div>
                        <div className="text-base font-bold text-foreground">{change.author}</div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-border pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="rounded-xl"
                    >
                        Закрити
                    </Button>
                    <Button type="button" variant="primary" className="rounded-xl">
                        Перейти до об&apos;єкта
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
