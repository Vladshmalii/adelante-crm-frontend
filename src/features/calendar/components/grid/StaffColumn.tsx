'use client';

import { StaffMember, Appointment, TimeSlot } from '../../types';
import { AppointmentCard } from '../items/AppointmentCard';
import { useCurrentTime } from '@/shared/hooks/useCurrentTime';
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
}: StaffColumnProps) {
    const currentTime = useCurrentTime();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    const getCurrentTimePosition = () => {
        const totalMinutes = (currentHour - startHour) * 60 + currentMinute;
        return (totalMinutes / 30) * slotHeight;
    };

    const getAppointmentStyle = (appointment: Appointment) => {
        const [aptStartHour, aptStartMinute] = appointment.startTime.split(':').map(Number);
        const [aptEndHour, aptEndMinute] = appointment.endTime.split(':').map(Number);

        const startMinutes = (aptStartHour - startHour) * 60 + aptStartMinute;
        const endMinutes = (aptEndHour - startHour) * 60 + aptEndMinute;
        const duration = endMinutes - startMinutes;

        const top = (startMinutes / 30) * slotHeight;
        const height = (duration / 30) * slotHeight;

        return {
            top: `${top}px`,
            height: `${height}px`,
        };
    };

    const handleSlotClick = (hour: number, minute: number) => {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        onSlotClick(staff.id, timeString);
    };

    const isCurrentTimeVisible = currentHour >= startHour && currentHour <= 20;
    const currentTimeTop = getCurrentTimePosition();

    return (
        <div className="flex-1 min-w-[150px] sm:min-w-[200px] border-r border-border bg-background relative">
            <div className="h-16 px-2 sm:px-3 flex flex-col justify-center border-b border-border bg-muted/30">
                <div className="font-semibold text-foreground text-xs sm:text-sm truncate font-heading">
                    {staff.name}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {staff.role}
                </div>
            </div>

            <div className="relative">
                {timeSlots.map((slot) => (
                    <div
                        key={`${slot.hour}-${slot.minute}`}
                        className={clsx(
                            'border-b border-border/50 cursor-pointer transition-colors',
                            slot.isAfterWork
                                ? 'bg-muted/40 hover:bg-muted/60'
                                : 'hover:bg-accent/50'
                        )}
                        style={{ height: `${slotHeight}px` }}
                        onClick={() => handleSlotClick(slot.hour, slot.minute)}
                    />
                ))}

                {isCurrentTimeVisible && (
                    <div
                        className="absolute left-0 right-0 h-0.5 bg-accent z-20 pointer-events-none"
                        style={{ top: `${currentTimeTop}px` }}
                    >
                        <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-accent rounded-full shadow-sm" />
                    </div>
                )}

                {appointments.map((appointment) => (
                    <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onClick={onAppointmentClick}
                        style={getAppointmentStyle(appointment)}
                        isAdmin={isAdmin}
                    />
                ))}
            </div>
        </div>
    );
}