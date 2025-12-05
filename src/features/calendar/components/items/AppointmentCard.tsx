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
                    container: 'border-primary/60',
                    tint: 'bg-primary/15',
                    hover: 'group-hover:bg-primary/25',
                };
            case 'important':
                return {
                    container: 'border-accent/60',
                    tint: 'bg-accent/15',
                    hover: 'group-hover:bg-accent/25',
                };
            case 'special':
                return {
                    container: 'border-destructive/60',
                    tint: 'bg-destructive/15',
                    hover: 'group-hover:bg-destructive/25',
                };
            default:
                return {
                    container: 'border-border',
                    tint: 'bg-muted',
                    hover: 'group-hover:bg-muted/80',
                };
        }
    };

    const styles = getVariantStyles();

    const getStatusIcon = () => {
        switch (appointment.status) {
            case 'confirmed':
            case 'arrived':
            case 'completed':
            case 'paid':
                return <CheckCircle className="w-3 h-3 text-green-600" />;
            case 'cancelled':
            case 'no-show':
                return <XCircle className="w-3 h-3 text-destructive" />;
            default:
                return <Clock className="w-3 h-3 text-muted-foreground" />;
        }
    };

    const numericHeight =
        typeof style?.height === 'string'
            ? parseFloat(style.height as string)
            : typeof style?.height === 'number'
                ? style.height
                : undefined;

    const showClientRow = !numericHeight || numericHeight >= 80;
    const showPhoneRow = !numericHeight || numericHeight >= 120;
    const showNotesRow = !numericHeight || numericHeight >= 160;

    const getMaskedPhone = (phone?: string) => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        if (digits.length <= 4) return digits;
        const last4 = digits.slice(-4);
        return `•••• ${last4}`;
    };

    return (
        <div
            className={clsx(
                'group absolute inset-x-1 rounded-lg border p-0 cursor-pointer transition-all duration-200',
                'overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
                'animate-scale-in z-10',
                styles.container
            )}
            style={style}
            onClick={() => onClick(appointment)}
            title={`${appointment.clientName} - ${appointment.service}`}
        >
            {/* Solid Background Layer to hide grid lines */}
            <div className="absolute inset-0 bg-card" />

            {/* Tint Layer */}
            <div className={clsx('absolute inset-0 transition-colors duration-200', styles.tint, styles.hover)} />

            {/* Content Layer */}
            <div className="relative z-10 p-2 h-full flex flex-col">
                {/* Time */}
                <div className="flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">
                        {appointment.startTime}—{appointment.endTime}
                    </span>
                    <div className="ml-auto">{getStatusIcon()}</div>
                </div>

                {/* Service */}
                <div className="text-sm font-semibold mb-1 line-clamp-2 font-heading text-foreground">
                    {appointment.service}
                </div>

                {/* Client */}
                {showClientRow && (
                    <div className="flex items-center gap-1 text-xs mb-1 text-foreground">
                        <User className="w-3 h-3" />
                        <span className="truncate">{appointment.clientName}</span>
                    </div>
                )}

                {/* Phone */}
                {appointment.clientPhone && showPhoneRow && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span className="truncate">{getMaskedPhone(appointment.clientPhone)}</span>
                    </div>
                )}

                {/* Notes */}
                {appointment.notes && showNotesRow && (
                    <div className="flex items-start gap-1 text-xs mt-1 pt-1 border-t border-border/60 text-muted-foreground">
                        <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{appointment.notes}</span>
                    </div>
                )}
            </div>
        </div>
    );
}