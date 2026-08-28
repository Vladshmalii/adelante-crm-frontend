'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/shared/components/layout/AppShell';
import { DailyCalendar } from '@/features/calendar/components/DailyCalendar';

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState<Date | null>(null);

    useEffect(() => {
        setCurrentDate(new Date());
    }, []);

    if (!currentDate) return null;

    return (
        <AppShell activeSection="calendar">
            <DailyCalendar />
        </AppShell>
    );
}
