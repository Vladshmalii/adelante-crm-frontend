import { SEGMENTS } from '../constants';
import type { ClientSegment } from '../types';

interface ClientsSegmentsProps {
    activeSegment: ClientSegment;
    onSegmentChange: (segment: ClientSegment) => void;
}

export function ClientsSegments({ activeSegment, onSegmentChange }: ClientsSegmentsProps) {
    return (
        <div className="mb-6 flex items-center gap-6 border-b border-border">
            {SEGMENTS.map((segment) => (
                <button
                    key={segment.id}
                    onClick={() => onSegmentChange(segment.id)}
                    className={`relative px-1 pb-3 text-sm font-medium transition-colors ${
                        activeSegment === segment.id
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    } `}
                >
                    {segment.label}
                    {activeSegment === segment.id && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" />
                    )}
                </button>
            ))}
        </div>
    );
}
