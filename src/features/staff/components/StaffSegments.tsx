import { STATUSES } from '../constants';
import type { StaffStatus } from '../types';

interface StaffSegmentsProps {
    activeStatus: StaffStatus;
    onStatusChange: (status: StaffStatus) => void;
}

export function StaffSegments({
    activeStatus,
    onStatusChange,
}: StaffSegmentsProps) {
    return (
        <div className="flex items-center gap-6 border-b border-border mb-6 overflow-x-auto whitespace-nowrap pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {STATUSES.map((status) => (
                <button
                    key={status.id}
                    onClick={() => onStatusChange(status.id)}
                    className={`
            relative pb-3 px-1 text-sm font-medium transition-colors
            ${activeStatus === status.id
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                        }
          `}
                >
                    {status.label}
                    {activeStatus === status.id && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
            ))}
        </div>
    );
}
