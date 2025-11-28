import { Star } from 'lucide-react';
import type { Review } from '../../types';

interface ReviewItemProps {
    review: Review;
}

export function ReviewItem({ review }: ReviewItemProps) {
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    };

    return (
        <div className="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-foreground mb-1">{review.clientName}</h3>
                    <p className="text-xs text-muted-foreground">Майстер: {review.employee}</p>
                </div>
                <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            size={16}
                            className={
                                i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted-foreground'
                            }
                        />
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                <span>{review.phone}</span>
                <span>{formatDateTime(review.date)}</span>
            </div>

            {review.text && (
                <p className="text-sm text-foreground leading-relaxed">{review.text}</p>
            )}
        </div>
    );
}