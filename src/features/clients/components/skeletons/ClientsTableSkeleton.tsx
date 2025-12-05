'use client';

import { Skeleton } from '@/shared/components/ui/Skeleton';

export function ClientsTableSkeleton() {
    return (
        <div className="space-y-4">
            {/* Header / Filter Bar Skeleton */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between bg-card p-4 rounded-lg border border-border">
                <div className="flex gap-3 flex-1">
                    <Skeleton width={250} height={36} /> {/* Search */}
                    <Skeleton width={120} height={36} /> {/* Filter */}
                </div>
                <div className="flex gap-3">
                    <Skeleton width={140} height={36} /> {/* Add Button */}
                    <Skeleton width={100} height={36} /> {/* Export */}
                </div>
            </div>

            {/* Segments / Stats Skeleton */}
            <div className="flex gap-4 overflow-x-auto pb-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="min-w-[150px] bg-card p-3 rounded-lg border border-border flex items-center gap-3">
                        <Skeleton variant="circle" width={12} height={12} />
                        <div className="flex flex-col gap-1">
                            <Skeleton variant="text" width={60} />
                            <Skeleton variant="text" width={30} height={10} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Skeleton */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/30">
                    <div className="col-span-1"><Skeleton variant="rectangle" width={20} height={20} /></div>
                    <div className="col-span-3"><Skeleton variant="text" width={80} /></div>
                    <div className="col-span-2"><Skeleton variant="text" width={80} /></div>
                    <div className="col-span-2"><Skeleton variant="text" width={60} /></div>
                    <div className="col-span-2"><Skeleton variant="text" width={70} /></div>
                    <div className="col-span-1"><Skeleton variant="text" width={40} /></div>
                    <div className="col-span-1"><Skeleton variant="text" width={20} /></div>
                </div>

                {/* Table Rows */}
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 p-4 border-b border-border last:border-0 items-center">
                        <div className="col-span-1"><Skeleton variant="rectangle" width={20} height={20} /></div>

                        {/* Client Name & Avatar */}
                        <div className="col-span-3 flex items-center gap-3">
                            <Skeleton variant="circle" width={32} height={32} />
                            <div className="flex flex-col gap-1.5 w-full">
                                <Skeleton variant="text" width="80%" />
                                <Skeleton variant="text" width="40%" height={10} />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="col-span-2">
                            <Skeleton variant="text" width={100} />
                        </div>

                        {/* Category */}
                        <div className="col-span-2">
                            <Skeleton variant="rectangle" width={80} height={24} className="rounded-full" />
                        </div>

                        {/* Last Visit */}
                        <div className="col-span-2">
                            <Skeleton variant="text" width={90} />
                        </div>

                        {/* Status */}
                        <div className="col-span-1">
                            <Skeleton variant="circle" width={10} height={10} />
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex justify-end">
                            <Skeleton variant="rectangle" width={28} height={28} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="flex justify-between items-center py-2">
                <Skeleton width={150} height={20} />
                <div className="flex gap-2">
                    <Skeleton width={32} height={32} />
                    <Skeleton width={32} height={32} />
                    <Skeleton width={32} height={32} />
                </div>
            </div>
        </div>
    );
}
