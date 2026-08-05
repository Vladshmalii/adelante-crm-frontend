'use client';

import { Skeleton } from '@/shared/components/ui/Skeleton';

export function StaffTableSkeleton() {
    return (
        <div className="space-y-4">
            {/* Stats / Header Skeleton */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
                    >
                        <Skeleton variant="rectangle" width={40} height={40} />
                        <div className="flex flex-1 flex-col gap-2">
                            <Skeleton variant="text" width={80} />
                            <Skeleton variant="text" width={40} height={16} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls Skeleton */}
            <div className="mb-4 flex justify-between gap-4 rounded-lg border border-border bg-card p-3">
                <div className="flex w-full max-w-md gap-2">
                    <Skeleton width="60%" height={36} />
                    <Skeleton width="30%" height={36} />
                </div>
                <div className="flex gap-2">
                    <Skeleton width={36} height={36} />
                    <Skeleton width={120} height={36} />
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="overflow-hidden rounded-lg border border-border bg-card">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 border-b border-border bg-muted/30 p-4">
                    <div className="col-span-1">
                        <Skeleton variant="rectangle" width={20} height={20} />
                    </div>
                    <div className="col-span-3">
                        <Skeleton variant="text" width={100} />
                    </div>
                    <div className="col-span-2">
                        <Skeleton variant="text" width={90} />
                    </div>
                    <div className="col-span-2">
                        <Skeleton variant="text" width={80} />
                    </div>
                    <div className="col-span-2">
                        <Skeleton variant="text" width={80} />
                    </div>
                    <div className="col-span-2 flex justify-end">
                        <Skeleton variant="text" width={40} />
                    </div>
                </div>

                {/* Table Rows */}
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="grid grid-cols-12 items-center gap-4 border-b border-border p-4 last:border-0"
                    >
                        <div className="col-span-1">
                            <Skeleton variant="rectangle" width={20} height={20} />
                        </div>

                        {/* Name & Avatar */}
                        <div className="col-span-3 flex items-center gap-3">
                            <Skeleton variant="circle" width={36} height={36} />
                            <div className="flex flex-1 flex-col gap-1.5">
                                <Skeleton variant="text" width="70%" />
                                <Skeleton variant="text" width="40%" height={10} />
                            </div>
                        </div>

                        {/* Role */}
                        <div className="col-span-2">
                            <Skeleton
                                variant="rectangle"
                                width={90}
                                height={24}
                                className="rounded-full"
                            />
                        </div>

                        {/* Phone */}
                        <div className="col-span-2">
                            <Skeleton variant="text" width={110} />
                        </div>

                        {/* Status/Rate */}
                        <div className="col-span-2">
                            <Skeleton variant="text" width={60} />
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex justify-end gap-2">
                            <Skeleton width={32} height={32} />
                            <Skeleton width={32} height={32} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
