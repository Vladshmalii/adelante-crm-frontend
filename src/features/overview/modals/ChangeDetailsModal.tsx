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
        return CHANGE_ENTITIES.find(e => e.value === entity)?.label || entity;
    };

    const getActionLabel = (action: string) => {
        return CHANGE_ACTIONS.find(a => a.value === action)?.label || action;
    };

    const getActionVariant = (action: string): any => {
        switch (action) {
            case 'created': return 'success';
            case 'updated': return 'primary';
            case 'deleted': return 'destructive';
            default: return 'secondary';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Деталі зміни" size="md">
            <div className="space-y-6">
                {/* Header Badge */}
                <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50">
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">Тип операції</span>
                        <Badge variant={getActionVariant(change.action)} className="font-bold text-xs uppercase">
                            {getActionLabel(change.action)}
                        </Badge>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">Дата та час</span>
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <span>{formatDate(change.date)}</span>
                            <span className="text-muted-foreground/40">•</span>
                            <span>{formatTime(change.date)}</span>
                        </div>
                    </div>
                </div>

                {/* Entity Info */}
                <div className="p-4 bg-card rounded-2xl border border-border/50 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Layers size={24} />
                        </div>
                        <div>
                            <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">Об&apos;єкт зміни</div>
                            <div className="text-base font-bold text-foreground">{change.entityName}</div>
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-0.5">{getEntityLabel(change.entity)} ID: {change.entityId}</div>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="p-4 bg-card rounded-2xl border border-border/50 space-y-3">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground">
                            <FileText size={18} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">Опис змін</span>
                    </div>
                    <div className="text-sm text-foreground/80 leading-relaxed bg-secondary/10 p-4 rounded-xl border border-border/30">
                        {change.details}
                    </div>
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/50">
                    <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground">
                        <User size={24} />
                    </div>
                    <div>
                        <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">Автор зміни</div>
                        <div className="text-base font-bold text-foreground">{change.author}</div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl">
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
