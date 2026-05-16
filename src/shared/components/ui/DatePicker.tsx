import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface DatePickerProps {
    label?: string;
    value: string;
    onChange: (date: string) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    inline?: boolean;
    theme?: 'light' | 'dark';
    workloads?: Record<string, number>;
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
    workloads,
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

            <svg width="0" height="0" className="absolute pointer-events-none">
                <defs>
                    <linearGradient id="workload-low" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="workload-medium" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                    <linearGradient id="workload-high" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                </defs>
            </svg>

            <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                {getDaysInMonth(viewDate).map((date, index) => {
                    const invisible = !date ? ' invisible' : '';

                    let stateClasses = '';
                    const isSelected = date && isSelectedDate(date);
                    const isTodayDate = date && isToday(date);

                    if (isSelected) {
                        stateClasses = isDark
                            ? ' bg-sidebar-foreground text-sidebar font-bold'
                            : ' bg-primary text-primary-foreground font-medium';
                    } else if (isTodayDate) {
                        stateClasses = isDark
                            ? ' bg-primary text-primary-foreground font-semibold'
                            : ' border border-primary text-primary';
                    } else if (date) {
                        stateClasses = isDark
                            ? ' text-sidebar-foreground/80 hover:bg-sidebar-active/80 hover:text-sidebar-foreground'
                            : ' hover:bg-secondary';
                    }

                    const dateString = date ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : '';
                    const workload = date && workloads ? workloads[dateString] : undefined;

                    let ring = null;
                    if (date && workloads && workload !== undefined) {
                        const radius = 14;
                        const circumference = 2 * Math.PI * radius;
                        const strokeDashoffset = Math.max(0, circumference - (workload / 100) * circumference);
                        
                        let gradientId = 'url(#workload-low)';
                        let shadowColor = 'rgba(16, 185, 129, 0.4)';
                        if (workload > 66) {
                            gradientId = 'url(#workload-high)';
                            shadowColor = 'rgba(239, 68, 68, 0.4)';
                        } else if (workload > 33) {
                            gradientId = 'url(#workload-medium)';
                            shadowColor = 'rgba(245, 158, 11, 0.4)';
                        }

                        ring = (
                            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 32 32">
                                {/* Background track */}
                                <circle cx="16" cy="16" r="14" fill="none" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="1.5" strokeDasharray="1 3" />
                                
                                {/* Active progress ring */}
                                {workload > 0 && (
                                    <>
                                        {/* Fast Glow Effect (much better performance than CSS drop-shadow) */}
                                        <circle
                                            cx="16" cy="16" r="14" fill="none" stroke={shadowColor} strokeWidth="4" opacity="0.4"
                                            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                                            className="transition-all duration-700 ease-out"
                                        />
                                        {/* Main Ring */}
                                        <circle
                                            cx="16" cy="16" r="14" fill="none" stroke={gradientId} strokeWidth="2"
                                            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                                            className="transition-all duration-700 ease-out"
                                        />
                                    </>
                                )}
                            </svg>
                        );
                    } else if (date && workloads) {
                        // Workloads enabled but no data for this date
                        ring = (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 32 32">
                                <circle cx="16" cy="16" r="14" fill="none" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="1.5" strokeDasharray="1 3" />
                            </svg>
                        );
                    }

                    return (
                        <div key={index} className={`relative flex items-center justify-center w-8 h-8 mx-auto ${invisible}`}>
                            {ring}
                            <button
                                type="button"
                                onClick={() => date && handleSelectDate(date)}
                                disabled={!date}
                                className={`w-[22px] h-[22px] rounded-full flex items-center justify-center transition-colors ${isDark ? 'text-[11px]' : 'text-xs'} ${stateClasses}`}
                            >
                                {date?.getDate()}
                            </button>
                        </div>
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
                <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">
                    {label}
                </label>
            )}

            <button
                ref={buttonRef}
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`w-full flex items-center gap-3 px-4 h-[42px] text-sm
          bg-background border rounded-xl transition-all duration-200
          ${disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:border-primary/50 hover:bg-primary/[0.01] cursor-pointer'
                    }
          ${error ? 'border-destructive' : 'border-border/50'}
          ${isOpen ? 'ring-2 ring-primary/20 border-primary' : ''}
        `}
            >
                <Calendar size={18} className="text-muted-foreground/60" />
                <span className={clsx(
                    "truncate",
                    value ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}>
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