'use client';

import { BookingLayout } from '@/features/booking/components/BookingLayout';

export default function BookingDemoPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="mb-2 text-2xl font-bold text-foreground">Онлайн бронювання</h1>
                <p className="text-muted-foreground">
                    Публічна сторінка для клієнтів. Дозволяє обрати послугу, майстра, дату та час, а
                    потім підтвердити запис.
                </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <BookingLayout />
            </div>
        </div>
    );
}
