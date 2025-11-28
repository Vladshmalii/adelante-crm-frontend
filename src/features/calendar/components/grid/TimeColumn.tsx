import { TimeSlot } from '../../types';
import clsx from 'clsx';

interface TimeColumnProps {
    timeSlots: TimeSlot[];
    slotHeight: number;
}

export function TimeColumn({ timeSlots, slotHeight }: TimeColumnProps) {
    return (
        <div className="w-12 sm:w-16 flex-shrink-0 border-r border-border bg-background sticky left-0 z-10">
            {/* Header spacer */}
            <div className="h-16 border-b border-border bg-muted/30" />

            {/* Time slots */}
            <div className="relative">
                {timeSlots.map((slot, index) => (
                    <div
                        key={`${slot.hour}-${slot.minute}`}
                        className="relative border-b border-border/50"
                        style={{ height: `${slotHeight}px` }}
                    >
                        {slot.minute === 0 && (
                            <span className="absolute -top-2 right-1 sm:right-2 text-[10px] sm:text-xs font-medium text-muted-foreground">
                                {slot.label}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}