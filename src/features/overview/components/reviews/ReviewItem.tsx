import { Star } from 'lucide-react';
import type { Review } from '../../types';
import clsx from 'clsx';

interface ReviewItemProps {
    review: Review;
    onView: (review: Review) => void;
}

export function ReviewItem({ review, onView }: ReviewItemProps) {
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
        <div 
            className="p-5 bg-card border border-border/50 rounded-2xl hover:border-primary/30 transition-all duration-300 shadow-sm group cursor-pointer"
            onClick={() => onView(review)}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-[15px] font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{review.clientName}</h3>
                    <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wider">Майстер: {review.employee}</p>
                </div>
                <div className="flex items-center gap-1 bg-secondary/30 px-2 py-1 rounded-lg">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            size={14}
                            className={clsx(
                                'transition-all',
                                i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted-foreground/30'
                            )}
                        />
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4 text-[12px] text-muted-foreground mb-4 font-medium">
                <span className="flex items-center gap-1.5 bg-secondary/20 px-2 py-0.5 rounded-md">{review.phone}</span>
                <span className="flex items-center gap-1.5">{formatDateTime(review.date)}</span>
            </div>

            {review.text && (
                <div className="relative">
                    <p className="text-sm text-foreground/80 leading-relaxed italic pl-4 border-l-2 border-primary/20">
                        "{review.text}"
                    </p>
                </div>
            )}
        </div>
    );
}