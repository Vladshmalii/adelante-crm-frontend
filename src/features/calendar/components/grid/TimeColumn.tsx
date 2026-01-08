import { TimeSlot } from '../../types';
import clsx from 'clsx';

interface TimeColumnProps {
    timeSlots: TimeSlot[];
    slotHeight: number;
}

export function TimeColumn({ timeSlots, slotHeight }: TimeColumnProps) {
    return (
        <div className="w-16 sm:w-20 flex-shrink-0 bg-background border-r border-border/40 relative">
            {/* Header placeholder - matches height of StaffColumn headers - Sticky top to stay aligned */}
            <div className="h-20 border-b border-border/40 bg-background flex items-center justify-center sticky top-0 z-50">
                <div className="w-8 h-8 rounded-full bg-muted/10 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
                </div>
            </div>

            <div className="relative">
                {timeSlots.map((slot, index) => (
                    <div
                        key={`${slot.hour}-${slot.minute}`}
                        className={clsx(
                            'relative border-b border-border/20',
                            slot.isAfterWork && 'bg-muted/5'
                        )}
                        style={{ height: `${slotHeight}px` }}
                    >
                        {slot.minute === 0 && (
                            <div className={clsx(
                                "absolute left-0 right-0 flex justify-center z-20",
                                index === 0 ? "top-2" : "top-0 translate-y-[-50%]"
                            )}>
                                <span className={clsx(
                                    'text-[10px] sm:text-[11px] font-bold tracking-tight px-1.5 py-0.5 rounded-md transition-colors duration-300',
                                    slot.isAfterWork
                                        ? 'text-muted-foreground/20'
                                        : 'text-muted-foreground bg-background/50 backdrop-blur-sm shadow-sm border border-border/10'
                                )}>
                                    {slot.label}
                                </span>
                            </div>
                        )}
                        {slot.minute === 30 && (
                            <div className="absolute top-1/2 -translate-y-1/2 right-2 w-1 h-1 rounded-full bg-border/40" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}