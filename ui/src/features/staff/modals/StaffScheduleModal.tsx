'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Switch } from '@/shared/components/ui/Switch';
import { useToast } from '@/shared/hooks/useToast';
import { staffApi, type DaySchedule } from '@/lib/api/staff';
import { USE_MOCK_DATA } from '@/lib/config';
import type { Staff } from '../types';
import { Clock, Copy, RotateCcw } from 'lucide-react';

interface StaffScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: Staff | null;
    onSave: (schedule: Record<string, DaySchedule>) => void;
}

const DAYS_OF_WEEK = [
    { key: 'monday', label: 'Понеділок' },
    { key: 'tuesday', label: 'Вівторок' },
    { key: 'wednesday', label: 'Середа' },
    { key: 'thursday', label: 'Четвер' },
    { key: 'friday', label: "П'ятниця" },
    { key: 'saturday', label: 'Субота' },
    { key: 'sunday', label: 'Неділя' },
] as const;

const DEFAULT_DAY: DaySchedule = {
    isWorkDay: true,
    start: '09:00',
    end: '18:00',
    breakStart: '13:00',
    breakEnd: '14:00',
};
const DEFAULT_WEEKEND: DaySchedule = { isWorkDay: false, start: '09:00', end: '18:00' };

const getDefaultSchedule = (): Record<string, DaySchedule> =>
    Object.fromEntries(
        DAYS_OF_WEEK.map(({ key }) => [
            key,
            key === 'saturday' || key === 'sunday' ? { ...DEFAULT_WEEKEND } : { ...DEFAULT_DAY },
        ]),
    );

export function StaffScheduleModal({ isOpen, onClose, staff, onSave }: StaffScheduleModalProps) {
    const toast = useToast();
    const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(getDefaultSchedule());
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen || !staff) return;
        if (USE_MOCK_DATA) {
            setSchedule(getDefaultSchedule());
            return;
        }
        setIsLoading(true);
        staffApi
            .getSchedule(String(staff.id))
            .then((data) => setSchedule({ ...getDefaultSchedule(), ...data.week }))
            .catch((err) => {
                console.error('Failed to load schedule:', err);
                toast.error('Помилка', 'Не вдалося завантажити графік');
            })
            .finally(() => setIsLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, staff?.id]);

    if (!staff) return null;

    const handleDayChange = (day: string, field: keyof DaySchedule, value: string | boolean) => {
        setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    };

    const handleCopyToAll = (sourceDay: string) => {
        const sourceDayData = schedule[sourceDay];
        const newSchedule = { ...schedule };
        DAYS_OF_WEEK.forEach(({ key }) => {
            if (key !== sourceDay) newSchedule[key] = { ...sourceDayData };
        });
        setSchedule(newSchedule);
    };

    const handleReset = () => setSchedule(getDefaultSchedule());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (USE_MOCK_DATA) {
            onSave(schedule);
            toast.success('Графік роботи оновлено', 'Успіх');
            onClose();
            return;
        }
        setIsSaving(true);
        try {
            await staffApi.saveSchedule(String(staff.id), schedule);
            onSave(schedule);
            toast.success('Графік роботи оновлено', 'Успіх');
            onClose();
        } catch (err) {
            console.error('Failed to save schedule:', err);
            toast.error(
                'Помилка',
                err instanceof Error ? err.message : 'Не вдалося зберегти графік',
            );
        } finally {
            setIsSaving(false);
        }
    };

    const TimeInput = ({
        value,
        onChange,
    }: {
        value?: string;
        onChange: (val: string) => void;
    }) => (
        <input
            type="time"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="px-2 py-1.5 text-sm border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
        />
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Графік роботи: ${staff.firstName}`}
            size="lg"
        >
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
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

                    <div className="space-y-3">
                        {DAYS_OF_WEEK.map(({ key, label }) => {
                            const day = schedule[key] || DEFAULT_WEEKEND;
                            return (
                                <div
                                    key={key}
                                    className={`p-3 rounded-lg border transition-colors ${day.isWorkDay ? 'border-border bg-card' : 'border-border/50 bg-muted/30'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                checked={day.isWorkDay}
                                                onChange={(e) =>
                                                    handleDayChange(
                                                        key,
                                                        'isWorkDay',
                                                        e.target.checked,
                                                    )
                                                }
                                                size="sm"
                                            />
                                            <span
                                                className={`font-medium ${day.isWorkDay ? 'text-foreground' : 'text-muted-foreground'}`}
                                            >
                                                {label}
                                            </span>
                                        </div>
                                        {day.isWorkDay && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopyToAll(key)}
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
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Робочі години
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <TimeInput
                                                        value={day.start}
                                                        onChange={(val) =>
                                                            handleDayChange(key, 'start', val)
                                                        }
                                                    />
                                                    <span className="text-muted-foreground">—</span>
                                                    <TimeInput
                                                        value={day.end}
                                                        onChange={(val) =>
                                                            handleDayChange(key, 'end', val)
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Перерва (опціонально)
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <TimeInput
                                                        value={day.breakStart}
                                                        onChange={(val) =>
                                                            handleDayChange(key, 'breakStart', val)
                                                        }
                                                    />
                                                    <span className="text-muted-foreground">—</span>
                                                    <TimeInput
                                                        value={day.breakEnd}
                                                        onChange={(val) =>
                                                            handleDayChange(key, 'breakEnd', val)
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Скасувати
                        </Button>
                        <Button type="submit" variant="primary" disabled={isSaving}>
                            Зберегти графік
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
