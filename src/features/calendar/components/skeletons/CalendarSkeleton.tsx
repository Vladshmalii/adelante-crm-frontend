'use client';

import { Skeleton } from '@/shared/components/ui/Skeleton';

export function CalendarSkeleton() {
    return (
        <div className="flex flex-col h-full bg-background rounded-lg border border-border overflow-hidden">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-4">
                    <Skeleton width={120} height={32} /> {/* Date controls */}
                    <div className="flex gap-2">
                        <Skeleton width={80} height={32} />
                        <Skeleton width={80} height={32} />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton width={100} height={36} /> {/* Action button */}
                </div>
            </div>

            {/* Calendar Grid Skeleton */}
            <div className="flex flex-1 overflow-hidden">
                {/* Time Column */}
                <div className="w-16 flex-shrink-0 border-r border-border bg-card/30">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-20 border-b border-border/50 flex items-center justify-center p-2">
                            <Skeleton variant="text" width={30} />
                        </div>
                    ))}
                </div>

                {/* Staff Columns */}
                <div className="flex-1 flex overflow-hidden">
                    {Array.from({ length: 4 }).map((_, i) => ( // Show 4 columns as loading state
                        <div key={i} className="flex-1 p-2 border-r border-border/50 min-w-[200px]">
                            {/* Staff Header */}
                            <div className="flex items-center gap-3 mb-4 p-2 bg-muted/20 rounded-lg">
                                <Skeleton variant="circle" width={32} height={32} />
                                <div className="space-y-1.5 flex-1">
                                    <Skeleton variant="text" width="70%" />
                                    <Skeleton variant="text" width="40%" height={10} />
                                </div>
                            </div>

                            {/* Appointments Placeholders */}
                            <div className="space-y-4 px-1">
                                <Skeleton height={80} className="w-full opacity-60" />
                                <div className="h-12" /> {/* Gap */}
                                <Skeleton height={120} className="w-full opacity-60 bg-primary/5" />
                                <div className="h-24" /> {/* Gap */}
                                <Skeleton height={60} className="w-full opacity-60" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
