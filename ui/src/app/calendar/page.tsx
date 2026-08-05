'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/shared/components/layout/AppShell';
import { DailyCalendar } from '@/features/calendar/components/DailyCalendar';
import type { CalendarView } from '@/features/calendar/types';

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState<Date | null>(null);
    const [view, setView] = useState<CalendarView>('day');

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
