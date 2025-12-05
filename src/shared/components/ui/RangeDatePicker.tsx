'use client';

import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DateRange {
    from: string;
    to: string;
}

interface RangeDatePickerProps {
    label?: string;
    value: DateRange;
    onChange: (range: DateRange) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    showInfinite?: boolean;
}

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const MONTHS = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
];

export function RangeDatePicker({
    label,
    value,
    onChange,
    placeholder = 'Оберіть період',
    disabled = false,
    error,
    showInfinite = true,
}: RangeDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [selectingStart, setSelectingStart] = useState(true);
    const [hoverDate, setHoverDate] = useState<Date | null>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const updatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const showAbove = spaceBelow < 400;

            setPosition({
                top: showAbove ? rect.top - 380 : rect.bottom + 4,
                left: Math.min(rect.left, window.innerWidth - 340),
            });
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            updatePosition();
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    useEffect(() => {
        if (value.from && isOpen) {
            setViewDate(new Date(value.from));
        }
    }, [value.from, isOpen]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        if (dateString === 'infinite') return '∞';
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const formatDisplayValue = () => {
        if (!value.from && !value.to) return '';
        const fromStr = formatDate(value.from);
        const toStr = formatDate(value.to);
        if (fromStr && toStr) return `${fromStr} — ${toStr}`;
        if (fromStr) return `з ${fromStr}`;
        if (toStr) return `до ${toStr}`;
        return '';
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

        const days: Array<Date | null> = [];

        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1));
    };

    const toDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleSelectDate = (date: Date) => {
        const dateStr = toDateString(date);

        if (selectingStart) {
            onChange({ from: dateStr, to: '' });
            setSelectingStart(false);
        } else {
            const fromDate = new Date(value.from);
            if (date < fromDate) {
                onChange({ from: dateStr, to: value.from });
            } else {
                onChange({ ...value, to: dateStr });
            }
            setSelectingStart(true);
            setIsOpen(false);
        }
    };

    const handleToday = () => {
        const today = toDateString(new Date());
        onChange({ from: today, to: today });
        setIsOpen(false);
    };

    const handleInfinite = () => {
        onChange({ ...value, to: 'infinite' });
        setSelectingStart(true);
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange({ from: '', to: '' });
        setSelectingStart(true);
    };

    const isInRange = (date: Date | null) => {
        if (!date || !value.from) return false;
        const fromDate = new Date(value.from);

        if (value.to && value.to !== 'infinite') {
            const toDate = new Date(value.to);
            return date >= fromDate && date <= toDate;
        }

        if (hoverDate && !selectingStart) {
            const endDate = hoverDate > fromDate ? hoverDate : fromDate;
            const startDate = hoverDate < fromDate ? hoverDate : fromDate;
            return date >= startDate && date <= endDate;
        }

        return false;
    };

    const isStartDate = (date: Date | null) => {
        if (!date || !value.from) return false;
        const fromDate = new Date(value.from);
        return date.getDate() === fromDate.getDate() &&
            date.getMonth() === fromDate.getMonth() &&
            date.getFullYear() === fromDate.getFullYear();
    };

    const isEndDate = (date: Date | null) => {
        if (!date || !value.to || value.to === 'infinite') return false;
        const toDate = new Date(value.to);
        return date.getDate() === toDate.getDate() &&
            date.getMonth() === toDate.getMonth() &&
            date.getFullYear() === toDate.getFullYear();
    };

    const isToday = (date: Date | null) => {
        if (!date) return false;
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const calendarContent = (
        <div
            ref={pickerRef}
            className="fixed bg-card border border-border rounded-xl shadow-xl z-[9999] p-4 w-80"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                >
                    <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-semibold">
                    {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            <div className="text-xs text-muted-foreground mb-3 text-center">
                {selectingStart ? 'Оберіть початкову дату' : 'Оберіть кінцеву дату'}
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(day => (
                    <div
                        key={day}
                        className="text-center text-xs font-medium text-muted-foreground py-1"
                    >
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
                {getDaysInMonth(viewDate).map((date, index) => {
                    if (!date) {
                        return <div key={index} className="aspect-square" />;
                    }

                    const inRange = isInRange(date);
                    const isStart = isStartDate(date);
                    const isEnd = isEndDate(date);
                    const today = isToday(date);

                    let bgClasses = 'hover:bg-secondary';
                    if (isStart || isEnd) {
                        bgClasses = 'bg-primary text-primary-foreground';
                    } else if (inRange) {
                        bgClasses = 'bg-primary/20';
                    } else if (today) {
                        bgClasses = 'border border-primary text-primary';
                    }

                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleSelectDate(date)}
                            onMouseEnter={() => setHoverDate(date)}
                            onMouseLeave={() => setHoverDate(null)}
                            className={`aspect-square rounded-lg text-sm transition-colors ${bgClasses}`}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                <button
                    type="button"
                    onClick={handleToday}
                    className="flex-1 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors"
                >
                    Сьогодні
                </button>
                {showInfinite && (
                    <button
                        type="button"
                        onClick={handleInfinite}
                        disabled={!value.from}
                        className="flex-1 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Безстроково
                    </button>
                )}
            </div>

            {(value.from || value.to) && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="w-full mt-2 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                    Очистити
                </button>
            )}
        </div>
    );

    const handleToggle = () => {
        if (disabled) return;
        if (!isOpen) {
            updatePosition();
            setSelectingStart(true);
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative">
            {label && (
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    {label}
                </label>
            )}

            <button
                ref={buttonRef}
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm
                    bg-background border rounded-lg transition-colors
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 cursor-pointer'}
                    ${error ? 'border-destructive' : 'border-border'}
                    ${isOpen ? 'ring-2 ring-ring border-transparent' : ''}`}
            >
                <Calendar size={16} className="text-muted-foreground flex-shrink-0" />
                <span className={`flex-1 text-left truncate ${formatDisplayValue() ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {formatDisplayValue() || placeholder}
                </span>
                {(value.from || value.to) && !disabled && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClear();
                        }}
                        className="p-0.5 hover:bg-secondary rounded transition-colors"
                    >
                        <X size={14} className="text-muted-foreground" />
                    </button>
                )}
            </button>

            {error && (
                <p className="text-xs text-destructive mt-1">{error}</p>
            )}

            {isOpen && createPortal(calendarContent, document.body)}
        </div>
    );
}
