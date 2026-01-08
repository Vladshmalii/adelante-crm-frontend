'use client';

import { StaffMember, Appointment, TimeSlot } from '../../types';
import { AppointmentCard } from '../items/AppointmentCard';
import { useCurrentTime } from '@/shared/hooks/useCurrentTime';
import { getRoleLabel } from '@/features/staff/utils/roleTranslations';
import { User, Plus } from 'lucide-react';
import clsx from 'clsx';

interface StaffColumnProps {
    staff: StaffMember;
    appointments: Appointment[];
    timeSlots: TimeSlot[];
    slotHeight: number;
    startHour: number;
    onAppointmentClick: (appointment: Appointment) => void;
    onSlotClick: (staffId: string, time: string) => void;
    isAdmin: boolean;
    className?: string;
}

export function StaffColumn({
    staff,
    appointments,
    timeSlots,
    slotHeight,
    startHour,
    onAppointmentClick,
    onSlotClick,
    isAdmin,
    className,
}: StaffColumnProps) {
    const currentTime = useCurrentTime();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    const getCurrentTimePosition = () => {
        const totalMinutes = (currentHour - startHour) * 60 + currentMinute;
        return (totalMinutes / 30) * slotHeight;
    };

    const getProcessedAppointments = () => {
        const processed = appointments.map(apt => {
            const [hStart, mStart] = apt.startTime.split(':').map(Number);
            const [hEnd, mEnd] = apt.endTime.split(':').map(Number);
            return {
                ...apt,
                startMins: hStart * 60 + mStart,
                endMins: hEnd * 60 + mEnd,
            };
        }).sort((a, b) => a.startMins - b.startMins);

        const groups: any[][] = [];
        processed.forEach(apt => {
            let placed = false;
            for (const group of groups) {
                if (group.some(gApt => apt.startMins < gApt.endMins && apt.endMins > gApt.startMins)) {
                    group.push(apt);
                    placed = true;
                    break;
                }
            }
            if (!placed) groups.push([apt]);
        });

        return groups.flatMap(group => {
            return group.map((apt, index) => {
                const top = ((apt.startMins - startHour * 60) / 30) * slotHeight;
                const height = ((apt.endMins - apt.startMins) / 30) * slotHeight;
                const width = 100 / group.length;
                const left = width * index;

                return {
                    ...apt,
                    style: {
                        top: `${top}px`,
                        height: `${height}px`,
                        width: `${width}%`,
                        left: `${left}%`,
                        zIndex: 10 + index,
                    }
                };
            });
        });
    };

    const handleSlotClick = (hour: number, minute: number) => {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        onSlotClick(staff.id, timeString);
    };

    const isSlotOccupied = (hour: number, minute: number) => {
        const slotStart = hour * 60 + minute;
        const slotEnd = slotStart + 30;

        return appointments.some(apt => {
            const [hStart, mStart] = apt.startTime.split(':').map(Number);
            const [hEnd, mEnd] = apt.endTime.split(':').map(Number);
            const aptStart = hStart * 60 + mStart;
            const aptEnd = hEnd * 60 + mEnd;
            return slotStart < aptEnd && slotEnd > aptStart;
        });
    };

    const isCurrentTimeVisible = currentHour >= startHour && currentHour <= 21;
    const currentTimeTop = getCurrentTimePosition();

    return (
        <div className={clsx('flex-1 min-w-[180px] sm:min-w-[240px] relative transition-all', className)}>
            {/* COLUMN HEADER - Clean Typography & Accent bar */}
            <div className={clsx(
                "h-20 px-4 flex items-center border-b border-r border-border/40 sticky top-0 z-30 group/header overflow-hidden transition-colors",
                staff.id === 'unassigned' ? "bg-muted/10" : "bg-background/95 backdrop-blur-md"
            )}>
                <div className={clsx(
                    "absolute left-0 inset-y-2 w-1 transition-colors rounded-r-full",
                    staff.id === 'unassigned' ? "bg-muted-foreground/30" : "bg-primary/20 group-hover/header:bg-primary"
                )} />
                <div className="flex flex-col min-w-0 pl-1">
                    <span className="text-sm font-bold tracking-tight text-foreground truncate font-heading group-hover/header:text-primary transition-colors">
                        {staff.name}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground opacity-60 truncate">
                        {getRoleLabel(staff.role)}
                    </span>
                </div>
            </div>

            {/* GRID SLOTS */}
            <div className="relative">
                {timeSlots.map((slot) => {
                    const occupied = isSlotOccupied(slot.hour, slot.minute);
                    return (
                        <div
                            key={`${slot.hour}-${slot.minute}`}
                            className={clsx(
                                'border-b border-r border-border/20 transition-all duration-200 relative group/slot',
                                occupied
                                    ? 'bg-muted/5 cursor-default'
                                    : clsx(
                                        'cursor-pointer hover:bg-primary/[0.04]',
                                        staff.id === 'unassigned' && 'diagonal-stripes bg-muted/[0.02]'
                                    ),
                                slot.isAfterWork ? 'bg-muted/10 diagonal-stripes' : ''
                            )}
                            style={{ height: `${slotHeight}px` }}
                            onClick={occupied ? undefined : () => handleSlotClick(slot.hour, slot.minute)}
                        >
                            {/* Hover Action Indicator */}
                            {!occupied && !slot.isAfterWork && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-all duration-300">
                                    <div className="w-9 h-9 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white transform scale-50 group-hover/slot:scale-100 transition-transform duration-300">
                                        <Plus className="w-5 h-5" strokeWidth={3} />
                                    </div>
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/slot:opacity-100 transition-opacity" />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* CURRENT TIME INDICATOR */}
                {isCurrentTimeVisible && (
                    <div
                        className="absolute left-0 right-0 h-0.5 bg-primary z-20 pointer-events-none shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                        style={{ top: `${currentTimeTop}px` }}
                    >
                        <div className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-primary rounded-full shadow-lg ring-4 ring-primary/20" />
                        <div className="absolute right-2 -top-3 text-[8px] font-bold text-primary bg-background px-1 border border-primary/20 rounded shadow-sm">
                            ЗАРАЗ
                        </div>
                    </div>
                )}

                {/* APPOINTMENT CARDS */}
                {getProcessedAppointments().map((appointment) => (
                    <AppointmentCard
                        key={appointment.id}
                        appointment={appointment as any}
                        onClick={onAppointmentClick}
                        style={appointment.style}
                        isAdmin={isAdmin}
                    />
                ))}
            </div>
        </div>
    );
}