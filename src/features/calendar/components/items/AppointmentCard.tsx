'use client';

import { Appointment } from '../../types';
import clsx from 'clsx';
import { Clock, User, Phone, FileText, CheckCircle, XCircle } from 'lucide-react';

interface AppointmentCardProps {
    appointment: Appointment;
    onClick: (appointment: Appointment) => void;
    style?: React.CSSProperties;
    isAdmin: boolean;
}

export function AppointmentCard({ appointment, onClick, style, isAdmin }: AppointmentCardProps) {
    const getVariantStyles = () => {
        switch (appointment.type) {
            case 'standard':
                return {
                    container: 'border-primary/40',
                    tint: 'bg-primary/20',
                    hover: 'group-hover:bg-primary/30',
                    text: 'text-primary-foreground',
                    indicator: 'bg-primary',
                    tag: 'bg-primary/10 text-primary-text',
                };
            case 'important':
                return {
                    container: 'border-amber-500/40',
                    tint: 'bg-amber-500/10',
                    hover: 'group-hover:bg-amber-500/20',
                    text: 'text-amber-500',
                    indicator: 'bg-amber-600',
                    tag: 'bg-amber-500/10 text-amber-600',
                };
            case 'special':
                return {
                    container: 'border-destructive/40',
                    tint: 'bg-destructive/15',
                    hover: 'group-hover:bg-destructive/25',
                    text: 'text-destructive',
                    indicator: 'bg-destructive',
                    tag: 'bg-destructive/10 text-destructive',
                };
            default:
                return {
                    container: 'border-border/40',
                    tint: 'bg-muted/15',
                    hover: 'group-hover:bg-muted/25',
                    text: 'text-muted-foreground',
                    indicator: 'bg-muted-foreground',
                    tag: 'bg-muted/20 text-muted-foreground',
                };
        }
    };

    const styles = getVariantStyles();

    const getStatusIcon = (size: number = 4) => {
        const iconClass = `w-${size} h-${size}`;
        switch (appointment.status) {
            case 'confirmed':
            case 'arrived':
            case 'completed':
                return <CheckCircle className={`${iconClass} text-green-600`} strokeWidth={2.5} />;
            case 'cancelled':
            case 'no-show':
                return <XCircle className={`${iconClass} text-destructive`} strokeWidth={2.5} />;
            default:
                return <Clock className={`${iconClass} text-muted-foreground/60`} strokeWidth={2.5} />;
        }
    };

    const numericHeight =
        typeof style?.height === 'string'
            ? parseFloat(style.height as string)
            : typeof style?.height === 'number'
                ? style.height
                : undefined;

    const isTiny = numericHeight && numericHeight < 50;
    const isSmall = numericHeight && numericHeight < 90; // 30 min
    const isMedium = numericHeight && numericHeight >= 90 && numericHeight < 150; // 45-50 min
    const isLarge = !numericHeight || numericHeight >= 150; // 60+ min

    const getMaskedPhone = (phone?: string) => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        if (digits.length <= 4) return digits;
        const last4 = digits.slice(-4);
        return `•••• ${last4}`;
    };

    const isBreak = appointment.id.startsWith('break-');

    if (isBreak) {
        return (
            <div
                className="absolute inset-x-0 rounded-2xl border border-dashed border-border/30 bg-muted/5 transition-all z-10 flex items-center justify-center pointer-events-none"
                style={style}
            >
                {(!numericHeight || numericHeight >= 40) && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/20">Перерва</span>
                )}
            </div>
        );
    }

    return (
        <div
            className={clsx(
                'group absolute inset-x-1.5 rounded-2xl border-2 p-0 cursor-pointer transition-all duration-300',
                'overflow-hidden shadow-[0_8px_16px_-6px_rgba(0,0,0,0.1)] hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:scale-[0.98]',
                'animate-scale-in z-20',
                styles.container
            )}
            style={style}
            onClick={(e) => {
                e.stopPropagation();
                onClick(appointment);
            }}
        >
            <div className="absolute inset-0 bg-card" />
            <div className={clsx('absolute inset-0 transition-colors duration-300', styles.tint, styles.hover)} />
            <div className={clsx('absolute left-0 inset-y-0 w-1.5 shadow-[2px_0_10px_rgba(0,0,0,0.1)]', styles.indicator)} />

            <div className={clsx(
                "relative z-10 h-full flex flex-col min-w-0",
                isTiny ? "p-1 justify-center" : isSmall ? "p-2.5" : "p-3"
            )}>
                {!isTiny && (
                    <div className={clsx("flex items-center justify-between min-w-0", isSmall ? "mb-1.5" : "mb-2")}>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className={clsx(
                                "font-bold text-foreground antialiased bg-background/90 rounded-lg border border-border/10 shadow-sm",
                                isSmall ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"
                            )}>
                                {appointment.startTime}
                            </span>
                            {!isSmall && (
                                <>
                                    <div className="w-1 h-1 rounded-full bg-muted-foreground/20 shrink-0" />
                                    <span className="text-[11px] font-bold text-foreground/40 antialiased whitespace-nowrap">
                                        {appointment.endTime}
                                    </span>
                                </>
                            )}
                        </div>
                        <div className={clsx("rounded-lg bg-background/80 border border-border/5 shadow-sm shrink-0", isSmall ? "p-0.5" : "p-1")}>
                            {getStatusIcon(isSmall ? 3 : 4)}
                        </div>
                    </div>
                )}

                <div className={clsx(
                    "font-bold tracking-tight text-foreground leading-[1.2] font-heading antialiased min-w-0",
                    isTiny ? "text-[11px] truncate" : isSmall ? "text-[13px] line-clamp-2" : "text-[14px] line-clamp-2 mb-2"
                )}>
                    {isTiny && <span className="mr-1 opacity-60 font-medium">{appointment.startTime}</span>}
                    {appointment.service}
                </div>

                {isMedium && (
                    <div className="mt-auto flex items-center gap-1.5 bg-background/40 p-1 rounded-xl border border-border/5">
                        <User className="w-3 h-3 text-primary shrink-0 opacity-60" />
                        <span className="text-[10px] font-bold text-foreground truncate min-w-0">
                            {appointment.clientName}
                        </span>
                    </div>
                )}

                {isLarge && (
                    <div className="mt-auto flex flex-col gap-2">
                        <div className="flex items-center gap-2 min-w-0 bg-background/40 p-1.5 rounded-xl border border-border/5 shadow-sm">
                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <User className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[11px] font-bold text-foreground truncate leading-none mb-1">
                                    {appointment.clientName}
                                </span>
                                {appointment.clientPhone && (
                                    <span className="text-[9px] font-bold text-muted-foreground/60 tracking-wider">
                                        {getMaskedPhone(appointment.clientPhone)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {appointment.notes && (
                            <div className="flex items-start gap-2 p-2 bg-muted/20 rounded-xl border border-border/5">
                                <FileText className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                                <span className="text-[10px] font-medium text-muted-foreground line-clamp-2 leading-snug">
                                    {appointment.notes}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}