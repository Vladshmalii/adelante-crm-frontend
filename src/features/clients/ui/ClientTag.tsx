import { Badge } from '@/shared/components/ui/Badge';
import type { ClientSegment } from '../types';

interface ClientTagProps {
    segment: ClientSegment;
    size?: 'sm' | 'md';
}

export function ClientTag({ segment, size = 'sm' }: ClientTagProps) {
    const getSegmentLabel = (segment: ClientSegment): string => {
        const labels: Record<ClientSegment, string> = {
            'new': 'Новий',
            'repeat': 'Постійний',
            'lost': 'Втрачений',
            'subscription-ending': 'Закінчується підписка'
        };
        return labels[segment];
    };

    const getSegmentVariant = (segment: ClientSegment): 'success' | 'primary' | 'danger' | 'warning' => {
        const variants: Record<ClientSegment, 'success' | 'primary' | 'danger' | 'warning'> = {
            'new': 'success',
            'repeat': 'primary',
            'lost': 'danger',
            'subscription-ending': 'warning'
        };
        return variants[segment];
    };

    return (
        <Badge 
            variant={getSegmentVariant(segment)} 
            className="font-black uppercase text-[10px] px-2.5 py-1 tracking-wider"
        >
            {getSegmentLabel(segment)}
        </Badge>
    );
}