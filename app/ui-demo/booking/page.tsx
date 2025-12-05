'use client';

import { BookingLayout } from '@/features/booking/components/BookingLayout';

export default function BookingDemoPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Онлайн бронювання</h1>
                <p className="text-muted-foreground">
                    Публічна сторінка для клієнтів. Дозволяє обрати послугу, майстра,
                    дату та час, а потім підтвердити запис.
                </p>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <BookingLayout />
            </div>
        </div>
    );
}
