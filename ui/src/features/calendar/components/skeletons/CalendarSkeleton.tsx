'use client';

import { Skeleton } from '@/shared/components/ui/Skeleton';

export function CalendarSkeleton() {
    return (
        <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-background">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between border-b border-border p-4">
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
                        <div
                            key={i}
                            className="flex h-20 items-center justify-center border-b border-border/50 p-2"
                        >
                            <Skeleton variant="text" width={30} />
                        </div>
                    ))}
                </div>

                {/* Staff Columns */}
                <div className="flex flex-1 overflow-hidden">
                    {Array.from({ length: 4 }).map((_, i) => (
                        // Show 4 columns as loading state
                        <div key={i} className="min-w-[200px] flex-1 border-r border-border/50 p-2">
                            {/* Staff Header */}
                            <div className="mb-4 flex items-center gap-3 rounded-lg bg-muted/20 p-2">
                                <Skeleton variant="circle" width={32} height={32} />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton variant="text" width="70%" />
                                    <Skeleton variant="text" width="40%" height={10} />
                                </div>
                            </div>

                            {/* Appointments Placeholders */}
                            <div className="space-y-4 px-1">
                                <Skeleton height={80} className="w-full opacity-60" />
                                <div className="h-12" /> {/* Gap */}
                                <Skeleton height={120} className="w-full bg-primary/5 opacity-60" />
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
