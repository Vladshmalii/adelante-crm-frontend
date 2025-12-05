import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DatePickerProps {
    label?: string;
    value: string;
    onChange: (date: string) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    inline?: boolean;
    theme?: 'light' | 'dark';
}

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const MONTHS = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
];

export function DatePicker({
    label,
    value,
    onChange,
    placeholder = 'Оберіть дату',
    disabled = false,
    error,
    inline = false,
    theme = 'light',
}: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const pickerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const updatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();

            const spaceBelow = window.innerHeight - rect.bottom;
            const showAbove = spaceBelow < 350;

            setPosition({
                top: showAbove
                    ? rect.top - 320 // approximate height + offset
                    : rect.bottom + 4,
                left: rect.left,
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

        if (isOpen && !inline) {
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
    }, [isOpen, inline]);

    useEffect(() => {
        if (value && (isOpen || inline)) {
            setViewDate(new Date(value));
        }
    }, [value, isOpen, inline]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
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

    const handleSelectDate = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        onChange(`${year}-${month}-${day}`);
        if (!inline) {
            setIsOpen(false);
        }
    };

    const isSelectedDate = (date: Date | null) => {
        if (!date || !value) return false;
        const selectedDate = new Date(value);
        return (
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear()
        );
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

    const isDark = theme === 'dark';

    const calendarContent = (
        <div
            ref={pickerRef}
            className={inline ? '' : 'fixed bg-card border border-border rounded-lg shadow-lg z-[9999] p-3 w-72'}
            style={inline ? {} : {
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            <div className="flex items-center justify-between mb-3">
                <button
                    type="button"
                    onClick={handlePrevMonth}
                    className={`p-1 rounded transition-colors ${isDark
                        ? 'hover:bg-sidebar-active text-sidebar-foreground/60 hover:text-sidebar-foreground'
                        : 'hover:bg-secondary'
                        }`}
                >
                    <ChevronLeft size={isDark ? 16 : 18} />
                </button>
                <span className={`text-sm font-medium ${isDark ? 'text-sidebar-foreground' : ''}`}>
                    {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button
                    type="button"
                    onClick={handleNextMonth}
                    className={`p-1 rounded transition-colors ${isDark
                        ? 'hover:bg-sidebar-active text-sidebar-foreground/60 hover:text-sidebar-foreground'
                        : 'hover:bg-secondary'
                        }`}
                >
                    <ChevronRight size={isDark ? 16 : 18} />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(day => (
                    <div
                        key={day}
                        className={`text-center font-medium py-1 ${isDark
                            ? 'text-[10px] text-sidebar-foreground/50'
                            : 'text-xs text-muted-foreground'
                            }`}
                    >
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(viewDate).map((date, index) => {
                    const baseClasses = 'aspect-square rounded transition-colors ' + (isDark ? 'text-xs' : 'text-sm');
                    const invisible = !date ? ' invisible' : '';

                    let stateClasses = '';
                    if (date && isSelectedDate(date)) {
                        stateClasses = ' bg-primary text-primary-foreground font-medium';
                    } else if (date && isToday(date)) {
                        stateClasses = isDark
                            ? ' bg-primary text-primary-foreground font-semibold'
                            : ' border border-primary text-primary';
                    } else if (date) {
                        stateClasses = isDark
                            ? ' text-sidebar-foreground/80 hover:bg-sidebar-active hover:text-sidebar-foreground'
                            : ' hover:bg-secondary';
                    }

                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={() => date && handleSelectDate(date)}
                            disabled={!date}
                            className={baseClasses + invisible + stateClasses}
                        >
                            {date?.getDate()}
                        </button>
                    );
                })}
            </div>

            {!inline && (
                <div className="mt-3 flex justify-end">
                    <button
                        type="button"
                        onClick={() => {
                            const today = new Date();
                            setViewDate(today);
                            handleSelectDate(today);
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/60 hover:bg-primary/5 transition-colors"
                    >
                        сьогодні
                    </button>
                </div>
            )}
        </div>
    );

    if (inline) {
        return calendarContent;
    }

    const handleToggle = () => {
        if (disabled) return;
        if (!isOpen) {
            updatePosition();
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
          ${disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:border-primary/50 cursor-pointer'
                    }
          ${error ? 'border-destructive' : 'border-border'}
          ${isOpen ? 'ring-2 ring-ring border-transparent' : ''}
        `}
            >
                <Calendar size={16} className="text-muted-foreground" />
                <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
                    {value ? formatDate(value) : placeholder}
                </span>
            </button>

            {error && (
                <p className="text-xs text-destructive mt-1">{error}</p>
            )}

            {isOpen && createPortal(calendarContent, document.body)}
        </div>
    );
}