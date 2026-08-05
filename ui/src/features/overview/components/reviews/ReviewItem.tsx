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
            className="group cursor-pointer rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all duration-300 hover:border-primary/30"
            onClick={() => onView(review)}
        >
            <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="mb-1 text-[15px] font-bold text-foreground transition-colors group-hover:text-primary">
                        {review.clientName}
                    </h3>
                    <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                        Майстер: {review.employee}
                    </p>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-secondary/30 px-2 py-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            size={14}
                            className={clsx(
                                'transition-all',
                                i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted-foreground/30',
                            )}
                        />
                    ))}
                </div>
            </div>

            <div className="mb-4 flex items-center gap-4 text-[12px] font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5 rounded-md bg-secondary/20 px-2 py-0.5">
                    {review.phone}
                </span>
                <span className="flex items-center gap-1.5">{formatDateTime(review.date)}</span>
            </div>

            {review.text && (
                <div className="relative">
                    <p className="border-l-2 border-primary/20 pl-4 text-sm italic leading-relaxed text-foreground/80">
                        "{review.text}"
                    </p>
                </div>
            )}
        </div>
    );
}
