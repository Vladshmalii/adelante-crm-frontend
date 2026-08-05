import { STATUSES } from '../constants';
import type { StaffStatus } from '../types';

interface StaffSegmentsProps {
    activeStatus: StaffStatus;
    onStatusChange: (status: StaffStatus) => void;
}

export function StaffSegments({ activeStatus, onStatusChange }: StaffSegmentsProps) {
    return (
        <div className="scrollbar-hide -mx-4 mb-6 flex items-center gap-6 overflow-x-auto whitespace-nowrap border-b border-border px-4 pb-1 sm:mx-0 sm:px-0">
            {STATUSES.map((status) => (
                <button
                    key={status.id}
                    onClick={() => onStatusChange(status.id)}
                    className={`relative px-1 pb-3 text-sm font-medium transition-colors ${
                        activeStatus === status.id
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    } `}
                >
                    {status.label}
                    {activeStatus === status.id && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" />
                    )}
                </button>
            ))}
        </div>
    );
}
