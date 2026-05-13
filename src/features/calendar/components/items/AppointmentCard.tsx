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
                    indicator: 'bg-primary',
                };
            case 'important':
                return {
                    container: 'border-amber-500/40',
                    tint: 'bg-amber-500/10',
                    hover: 'group-hover:bg-amber-500/20',
                    indicator: 'bg-amber-600',
                };
            case 'special':
                return {
                    container: 'border-destructive/40',
                    tint: 'bg-destructive/15',
                    hover: 'group-hover:bg-destructive/25',
                    indicator: 'bg-destructive',
                };
            default:
                return {
                    container: 'border-border/40',
                    tint: 'bg-muted/15',
                    hover: 'group-hover:bg-muted/25',
                    indicator: 'bg-muted-foreground',
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

    const isTiny = numericHeight && numericHeight < 40;
    const isSmall = numericHeight && numericHeight < 70;
    const isMedium = numericHeight && numericHeight >= 70 && numericHeight < 120;
    const isLarge = !numericHeight || numericHeight >= 120;

    const getMaskedPhone = (phone?: string) => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        if (digits.length <= 4) return digits;
        return `**** ${digits.slice(-4)}`;
    };

    const isBreak = appointment.id.startsWith('break-');

    if (isBreak) {
        return (
            <div
                className="absolute inset-x-0 rounded-xl border border-dashed border-border/30 bg-muted/5 transition-all z-10 flex items-center justify-center pointer-events-none"
                style={style}
            >
                {(!numericHeight || numericHeight >= 30) && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/20">Перерва</span>
                )}
            </div>
        );
    }

    return (
        <div
            className={clsx(
                'group absolute inset-x-1 rounded-xl border p-0 cursor-pointer transition-all duration-500',
                'overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]',
                'animate-scale-in z-20 hover:!z-[100] hover:scale-[1.02] hover:ring-2 hover:ring-primary/20',
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
            <div className={clsx('absolute left-0 inset-y-0 w-1 shadow-sm', styles.indicator)} />

            <div className={clsx(
                "relative z-10 h-full flex flex-col min-w-0",
                isTiny ? "p-0.5 justify-center" : isSmall ? "p-1.5" : "p-2"
            )}>
                {/* Top Row: Time + Service Name */}
                <div className={clsx("flex items-start justify-between min-w-0 gap-2", isSmall ? "mb-0.5" : "mb-1")}>
                    <div className="flex items-center flex-wrap gap-1.5 min-w-0">
                        <span className={clsx(
                            "font-black text-foreground antialiased bg-background/80 rounded px-1 py-0.5 border border-border/5 shrink-0",
                            isSmall ? "text-[8px]" : "text-[9px]"
                        )}>
                            {appointment.startTime}
                        </span>
                        
                        {/* Service name next to time */}
                        <span className={clsx(
                            "font-bold tracking-tight text-foreground leading-[1.1] font-heading antialiased truncate",
                            isSmall ? "text-[10px]" : "text-[11px]"
                        )}>
                            {appointment.service}
                        </span>
                    </div>
                    
                    {!isTiny && (
                        <div className={clsx("rounded bg-background/40 border border-border/5 shrink-0 mt-0.5", isSmall ? "p-0" : "p-0.5")}>
                            {getStatusIcon(isSmall ? 2.5 : 3)}
                        </div>
                    )}
                </div>

                {/* Sub-info Row: Client Name + Last 4 digits */}
                {!isTiny && (appointment.clientName || appointment.otherPersonName) && (
                    <div className={clsx(
                        "mt-auto flex items-center gap-1.5 bg-background/30 rounded border border-border/5",
                        isSmall ? "px-1 py-0" : "px-1.5 py-0.5"
                    )}>
                        <User className={clsx("w-2.5 h-2.5 shrink-0 opacity-40", appointment.isForAnotherPerson ? "text-amber-500" : "text-primary")} />
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                            <span className={clsx(
                                "font-bold text-foreground truncate",
                                isSmall ? "text-[8px]" : "text-[9px]"
                            )}>
                                {appointment.isForAnotherPerson ? (appointment.otherPersonName || `Від: ${appointment.clientName}`) : appointment.clientName}
                                {appointment.isForAnotherPerson && <span className="ml-0.5 text-[7px] text-amber-500/80 uppercase font-black tracking-widest">(Гість)</span>}
                            </span>
                            {(appointment.isForAnotherPerson ? (appointment.otherPersonPhone || appointment.clientPhone) : appointment.clientPhone) && (
                                <span className={clsx(
                                    "font-medium text-muted-foreground/60 shrink-0",
                                    isSmall ? "text-[7px]" : "text-[8px]"
                                )}>
                                    {getMaskedPhone(appointment.isForAnotherPerson ? (appointment.otherPersonPhone || appointment.clientPhone!) : appointment.clientPhone!)}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {isLarge && appointment.notes && (
                    <div className="mt-1 flex items-start gap-1 p-1 bg-muted/10 rounded border border-border/5">
                        <FileText className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
                        <span className="text-[8px] font-medium text-muted-foreground line-clamp-1 leading-snug">
                            {appointment.notes}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}