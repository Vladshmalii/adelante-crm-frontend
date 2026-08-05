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
    slotDuration: number;
    isFitToScreen: boolean;
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
    slotDuration,
    isFitToScreen,
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
        return (totalMinutes / slotDuration) * slotHeight;
    };

    const getProcessedAppointments = () => {
        const processed = appointments
            .map((apt) => {
                const [hStart, mStart] = apt.startTime.split(':').map(Number);
                const [hEnd, mEnd] = apt.endTime.split(':').map(Number);
                return {
                    ...apt,
                    startMins: hStart * 60 + mStart,
                    endMins: hEnd * 60 + mEnd,
                };
            })
            .sort((a, b) => a.startMins - b.startMins);

        const groups: any[][] = [];
        processed.forEach((apt) => {
            let placed = false;
            for (const group of groups) {
                if (
                    group.some(
                        (gApt) => apt.startMins < gApt.endMins && apt.endMins > gApt.startMins,
                    )
                ) {
                    group.push(apt);
                    placed = true;
                    break;
                }
            }
            if (!placed) groups.push([apt]);
        });

        return groups.flatMap((group) => {
            return group.map((apt, index) => {
                const top = ((apt.startMins - startHour * 60) / slotDuration) * slotHeight;
                const height = ((apt.endMins - apt.startMins) / slotDuration) * slotHeight;

                // Стек вместо разделения ширины
                // Каждая следующая карточка накладывается со смещением
                const offset = index * 10; // 10% смещение
                const width = 100 - offset;
                const left = offset;

                return {
                    ...apt,
                    style: {
                        top: `${top}px`,
                        height: `${height}px`,
                        width: `${width}%`,
                        left: `${left}%`,
                        zIndex: 10 + index,
                    },
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
        const slotEnd = slotStart + slotDuration;

        return appointments.some((apt) => {
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
        <div
            className={clsx(
                'relative transition-all',
                isFitToScreen
                    ? staff.id === 'unassigned'
                        ? 'min-w-0 flex-[0.6]'
                        : 'min-w-0 flex-1'
                    : 'min-w-[180px] sm:min-w-[240px]',
                className,
            )}
        >
            {/* COLUMN HEADER - Clean Typography & Accent bar */}
            <div
                className={clsx(
                    'group/header sticky top-0 z-30 flex h-20 items-center gap-3 overflow-hidden border-b border-r border-border/40 px-3 py-3 transition-colors sm:px-4',
                    staff.id === 'unassigned' ? 'bg-muted/10' : 'bg-background/95 backdrop-blur-md',
                )}
            >
                <div
                    className={clsx(
                        'absolute inset-y-2 left-0 w-1 rounded-r-full transition-colors',
                        staff.id === 'unassigned'
                            ? 'bg-muted-foreground/30'
                            : 'bg-primary/20 group-hover/header:bg-primary',
                    )}
                />
                <div className="flex min-w-0 flex-col pl-1">
                    <span className="truncate font-heading text-sm font-bold leading-tight tracking-tight text-foreground transition-colors group-hover/header:text-primary">
                        {staff.name}
                    </span>
                    <span className="truncate text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground opacity-60">
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
                                'group/slot relative border-b border-r border-border/20 transition-all duration-200',
                                occupied
                                    ? 'cursor-default bg-muted/5'
                                    : clsx(
                                          'cursor-pointer hover:bg-primary/[0.04]',
                                          staff.id === 'unassigned' &&
                                              'diagonal-stripes bg-muted/[0.02]',
                                      ),
                                slot.isAfterWork ? 'diagonal-stripes bg-muted/10' : '',
                            )}
                            style={{ height: `${slotHeight}px` }}
                            onClick={
                                occupied ? undefined : () => handleSlotClick(slot.hour, slot.minute)
                            }
                        >
                            {/* Hover Action Indicator */}
                            {!occupied && !slot.isAfterWork && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover/slot:opacity-100">
                                    <div className="flex h-9 w-9 scale-50 transform items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transition-transform duration-300 group-hover/slot:scale-100">
                                        <Plus className="h-5 w-5" strokeWidth={3} />
                                    </div>
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 transition-opacity group-hover/slot:opacity-100" />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* CURRENT TIME INDICATOR */}
                {isCurrentTimeVisible && (
                    <div
                        className="pointer-events-none absolute left-0 right-0 z-20 h-0.5 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                        style={{ top: `${currentTimeTop}px` }}
                    >
                        <div className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary shadow-lg ring-4 ring-primary/20" />
                        <div className="absolute -top-3 right-2 rounded border border-primary/20 bg-background px-1 text-[8px] font-bold text-primary shadow-sm">
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
