import { SEGMENTS } from '../constants';
import type { ClientSegment } from '../types';

interface ClientsSegmentsProps {
    activeSegment: ClientSegment;
    onSegmentChange: (segment: ClientSegment) => void;
}

export function ClientsSegments({
                                    activeSegment,
                                    onSegmentChange,
                                }: ClientsSegmentsProps) {
    return (
        <div className="flex items-center gap-6 border-b border-border mb-6">
            {SEGMENTS.map((segment) => (
                <button
                    key={segment.id}
                    onClick={() => onSegmentChange(segment.id)}
                    className={`
            relative pb-3 px-1 text-sm font-medium transition-colors
            ${
                        activeSegment === segment.id
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    }
          `}
                >
                    {segment.label}
                    {activeSegment === segment.id && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
            ))}
        </div>
    );
}