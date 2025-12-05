import { TimeSlot } from '../../types';
import clsx from 'clsx';

interface TimeColumnProps {
    timeSlots: TimeSlot[];
    slotHeight: number;
}

export function TimeColumn({ timeSlots, slotHeight }: TimeColumnProps) {
    return (
        <div className="w-12 sm:w-16 flex-shrink-0 border-r border-border bg-background">
            <div className="h-16 border-b border-border bg-muted/30" />
            <div className="relative">
                {timeSlots.map((slot) => (
                    <div
                        key={`${slot.hour}-${slot.minute}`}
                        className={clsx(
                            'relative border-b border-border/50',
                            slot.isAfterWork && 'bg-muted/40'
                        )}
                        style={{ height: `${slotHeight}px` }}
                    >
                        {slot.minute === 0 && (
                            <span className={clsx(
                                'absolute -top-2 right-1 sm:right-2 text-[10px] sm:text-xs font-medium bg-background px-1',
                                slot.isAfterWork ? 'text-muted-foreground/50' : 'text-muted-foreground'
                            )}>
                                {slot.label}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}