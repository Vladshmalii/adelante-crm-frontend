'use client';

import { Appointment } from '../../types';
import clsx from 'clsx';
import { Clock, User, Phone, FileText, CheckCircle, XCircle } from 'lucide-react';

interface AppointmentCardProps {
    appointment: Appointment;
    onClick: (appointment: Appointment) => void;
    style?: React.CSSProperties;
}

export function AppointmentCard({ appointment, onClick, style }: AppointmentCardProps) {
    const getCardColor = () => {
        switch (appointment.type) {
            case 'standard':
                return 'bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary-foreground';
            case 'important':
                return 'bg-accent/10 border-accent/20 hover:bg-accent/20 text-accent-foreground';
            case 'special':
                return 'bg-destructive/10 border-destructive/20 hover:bg-destructive/20 text-destructive-foreground';
            default:
                return 'bg-muted border-muted-foreground/20 hover:bg-muted/80 text-muted-foreground';
        }
    };

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

    return (
        <div
            className={clsx(
                'absolute inset-x-1 rounded-lg border p-2 cursor-pointer transition-all duration-200',
                'overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
                'animate-scale-in',
                getCardColor()
            )}
            style={style}
            onClick={() => onClick(appointment)}
            title={`${appointment.clientName} - ${appointment.service}`}
        >
            {/* Time */}
            <div className="flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3 opacity-70" />
                <span className="text-xs font-semibold opacity-90">
                    {appointment.startTime}—{appointment.endTime}
                </span>
                <div className="ml-auto">{getStatusIcon()}</div>
            </div>

            {/* Service */}
            <div className="text-sm font-medium mb-1 line-clamp-2 font-heading opacity-100 text-foreground">
                {appointment.service}
            </div>

            {/* Client */}
            <div className="flex items-center gap-1 text-xs opacity-80 mb-1 text-foreground">
                <User className="w-3 h-3" />
                <span className="truncate">{appointment.clientName}</span>
            </div>

            {/* Phone */}
            {appointment.clientPhone && (
                <div className="flex items-center gap-1 text-xs opacity-70 text-foreground">
                    <Phone className="w-3 h-3" />
                    <span className="truncate">{appointment.clientPhone}</span>
                </div>
            )}

            {/* Notes */}
            {appointment.notes && (
                <div className="flex items-start gap-1 text-xs opacity-70 mt-1 pt-1 border-t border-black/5 text-foreground">
                    <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{appointment.notes}</span>
                </div>
            )}
        </div>
    );
}