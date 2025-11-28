import { ReviewItem } from './ReviewItem';
import type { Review } from '../../types';

interface ReviewsListProps {
    reviews: Review[];
}

export function ReviewsList({ reviews }: ReviewsListProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
            ))}
        </div>
    );
}