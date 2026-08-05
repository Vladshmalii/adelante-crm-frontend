import { TimeSlot } from '../../types';
import clsx from 'clsx';

interface TimeColumnProps {
    timeSlots: TimeSlot[];
    slotHeight: number;
}

export function TimeColumn({ timeSlots, slotHeight }: TimeColumnProps) {
    return (
        <div className="relative w-16 flex-shrink-0 border-r border-border/40 bg-background sm:w-20">
            {/* Header placeholder - matches height of StaffColumn headers - Sticky top to stay aligned */}
            <div className="sticky top-0 z-50 flex h-20 items-center justify-center border-b border-border/40 bg-background">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/10">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" />
                </div>
            </div>

            <div className="relative">
                {timeSlots.map((slot, index) => (
                    <div
                        key={`${slot.hour}-${slot.minute}`}
                        className={clsx(
                            'relative border-b border-border/20',
                            slot.isAfterWork && 'bg-muted/5',
                        )}
                        style={{ height: `${slotHeight}px` }}
                    >
                        {slot.minute === 0 ? (
                            <div
                                className={clsx(
                                    'absolute left-0 right-0 z-20 flex justify-center',
                                    index === 0 ? 'top-2' : 'top-0 translate-y-[-50%]',
                                )}
                            >
                                <span
                                    className={clsx(
                                        'rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-tight transition-colors duration-300 sm:text-[11px]',
                                        slot.isAfterWork
                                            ? 'text-muted-foreground/20'
                                            : 'border border-border/10 bg-background/50 text-muted-foreground shadow-sm backdrop-blur-sm',
                                    )}
                                >
                                    {slot.label}
                                </span>
                            </div>
                        ) : (
                            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                                <div className="h-1 w-1 rounded-full bg-border/40" />
                                {timeSlots.length < 50 && (
                                    <span className="text-[8px] font-medium text-muted-foreground/30">
                                        {slot.minute}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
