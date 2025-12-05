'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Switch } from '@/shared/components/ui/Switch';
import type { Staff } from '../types';
import { Clock, Copy, RotateCcw } from 'lucide-react';

interface StaffScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: Staff | null;
    onSave: (schedule: WeekSchedule) => void;
}

interface DaySchedule {
    isWorkDay: boolean;
    startTime: string;
    endTime: string;
    breakStart?: string;
    breakEnd?: string;
}

interface WeekSchedule {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}

const DAYS_OF_WEEK = [
    { key: 'monday', label: 'Понеділок', short: 'Пн' },
    { key: 'tuesday', label: 'Вівторок', short: 'Вт' },
    { key: 'wednesday', label: 'Середа', short: 'Ср' },
    { key: 'thursday', label: 'Четвер', short: 'Чт' },
    { key: 'friday', label: "П'ятниця", short: 'Пт' },
    { key: 'saturday', label: 'Субота', short: 'Сб' },
    { key: 'sunday', label: 'Неділя', short: 'Нд' },
] as const;

const DEFAULT_DAY: DaySchedule = {
    isWorkDay: true,
    startTime: '09:00',
    endTime: '18:00',
    breakStart: '13:00',
    breakEnd: '14:00',
};

const DEFAULT_WEEKEND: DaySchedule = {
    isWorkDay: false,
    startTime: '09:00',
    endTime: '18:00',
};

const getDefaultSchedule = (): WeekSchedule => ({
    monday: { ...DEFAULT_DAY },
    tuesday: { ...DEFAULT_DAY },
    wednesday: { ...DEFAULT_DAY },
    thursday: { ...DEFAULT_DAY },
    friday: { ...DEFAULT_DAY },
    saturday: { ...DEFAULT_WEEKEND },
    sunday: { ...DEFAULT_WEEKEND },
});

export function StaffScheduleModal({ isOpen, onClose, staff, onSave }: StaffScheduleModalProps) {
    const [schedule, setSchedule] = useState<WeekSchedule>(getDefaultSchedule());

    if (!staff) return null;

    const handleDayChange = (day: keyof WeekSchedule, field: keyof DaySchedule, value: string | boolean) => {
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: value,
            },
        }));
    };

    const handleCopyToAll = (sourceDay: keyof WeekSchedule) => {
        const sourceDayData = schedule[sourceDay];
        const newSchedule = { ...schedule };

        DAYS_OF_WEEK.forEach(({ key }) => {
            if (key !== sourceDay) {
                newSchedule[key as keyof WeekSchedule] = { ...sourceDayData };
            }
        });

        setSchedule(newSchedule);
    };

    const handleReset = () => {
        setSchedule(getDefaultSchedule());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(schedule);
        onClose();
    };

    const TimeInput = ({ value, onChange, disabled }: { value: string; onChange: (val: string) => void; disabled?: boolean }) => (
        <input
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="px-2 py-1.5 text-sm border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Графік роботи: ${staff.firstName}`} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Quick Actions */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Налаштуйте робочі години для кожного дня тижня</span>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Скинути
                    </Button>
                </div>

                {/* Schedule Grid */}
                <div className="space-y-3">
                    {DAYS_OF_WEEK.map(({ key, label }) => {
                        const dayKey = key as keyof WeekSchedule;
                        const day = schedule[dayKey];

                        return (
                            <div
                                key={key}
                                className={`p-3 rounded-lg border transition-colors ${day.isWorkDay
                                        ? 'border-border bg-card'
                                        : 'border-border/50 bg-muted/30'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            checked={day.isWorkDay}
                                            onChange={(e) => handleDayChange(dayKey, 'isWorkDay', e.target.checked)}
                                            size="sm"
                                        />
                                        <span className={`font-medium ${day.isWorkDay ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {label}
                                        </span>
                                    </div>

                                    {day.isWorkDay && (
                                        <button
                                            type="button"
                                            onClick={() => handleCopyToAll(dayKey)}
                                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                            title="Копіювати на всі дні"
                                        >
                                            <Copy className="w-3 h-3" />
                                            Копіювати
                                        </button>
                                    )}
                                </div>

                                {day.isWorkDay && (
                                    <div className="mt-3 grid grid-cols-2 gap-4">
                                        {/* Work Hours */}
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground">Робочі години</p>
                                            <div className="flex items-center gap-2">
                                                <TimeInput
                                                    value={day.startTime}
                                                    onChange={(val) => handleDayChange(dayKey, 'startTime', val)}
                                                />
                                                <span className="text-muted-foreground">—</span>
                                                <TimeInput
                                                    value={day.endTime}
                                                    onChange={(val) => handleDayChange(dayKey, 'endTime', val)}
                                                />
                                            </div>
                                        </div>

                                        {/* Break */}
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground">Перерва (опціонально)</p>
                                            <div className="flex items-center gap-2">
                                                <TimeInput
                                                    value={day.breakStart || ''}
                                                    onChange={(val) => handleDayChange(dayKey, 'breakStart', val)}
                                                />
                                                <span className="text-muted-foreground">—</span>
                                                <TimeInput
                                                    value={day.breakEnd || ''}
                                                    onChange={(val) => handleDayChange(dayKey, 'breakEnd', val)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Скасувати
                    </Button>
                    <Button type="submit" variant="primary">
                        Зберегти графік
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
