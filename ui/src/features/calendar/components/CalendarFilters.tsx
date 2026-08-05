'use client';

import { useState, useMemo } from 'react';
import {
    Filter,
    Users,
    CalendarDays,
    ShieldCheck,
    Briefcase,
    ChevronRight,
    CheckCircle2,
    Circle,
    Clock,
} from 'lucide-react';
import { StaffMember, Appointment } from '../types';
import clsx from 'clsx';
import { getRoleLabel } from '@/features/staff/utils/roleTranslations';

interface CalendarFiltersProps {
    allStaff: StaffMember[];
    selectedStaffIds: string[];
    onStaffFilterChange: (staffIds: string[]) => void;
    appointments: Appointment[];
    slotDuration: number;
    onSlotDurationChange: (duration: number) => void;
}

type FilterCategory = 'all' | 'today' | 'masters' | 'admin';

export function CalendarFilters({
    allStaff,
    selectedStaffIds,
    onStaffFilterChange,
    appointments,
    slotDuration,
    onSlotDurationChange,
}: CalendarFiltersProps) {
    const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');

    const slotOptions = [5, 15, 30, 60];

    // Identify who works today (has appointments)
    const workingTodayIds = useMemo(() => {
        const ids = new Set<string>();
        appointments.forEach((apt) => {
            if (apt.staffId) ids.add(apt.staffId.toString());
        });
        return ids;
    }, [appointments]);

    // Filter staff members based on category
    const filteredStaffList = useMemo(() => {
        switch (activeCategory) {
            case 'today':
                return allStaff.filter((s) => workingTodayIds.has(s.id));
            case 'masters':
                return allStaff.filter((s) => s.role === 'master');
            case 'admin':
                return allStaff.filter((s) => s.role === 'administrator' || s.role === 'manager');
            default:
                return allStaff;
        }
    }, [activeCategory, allStaff, workingTodayIds]);

    const toggleStaff = (staffId: string) => {
        if (selectedStaffIds.includes(staffId)) {
            onStaffFilterChange(selectedStaffIds.filter((id) => id !== staffId));
        } else {
            onStaffFilterChange([...selectedStaffIds, staffId]);
        }
    };

    const handleBulkSelect = (select: boolean) => {
        if (select) {
            // Add all currently visible staff to selection
            const visibleIds = filteredStaffList.map((s) => s.id);
            const newSelection = Array.from(new Set([...selectedStaffIds, ...visibleIds]));
            onStaffFilterChange(newSelection);
        } else {
            // Remove all currently visible staff from selection
            const visibleIds = new Set(filteredStaffList.map((s) => s.id));
            const newSelection = selectedStaffIds.filter((id) => !visibleIds.has(id));
            onStaffFilterChange(newSelection);
        }
    };

    interface Category {
        id: FilterCategory;
        label: string;
        icon: any;
        count?: number;
    }

    const categories: Category[] = [
        { id: 'all', label: 'Усі', icon: Users },
        { id: 'today', label: 'Сьогодні', icon: CalendarDays, count: workingTodayIds.size },
        { id: 'masters', label: 'Майстри', icon: Briefcase },
        { id: 'admin', label: 'Адміністрація', icon: ShieldCheck },
    ];

    return (
        <div className="sticky top-20 z-20 border-b border-border/50 bg-background/80 px-4 py-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] backdrop-blur-md sm:px-8">
            <div className="w-full space-y-4">
                {/* Categories & Actions */}
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center lg:gap-4">
                    <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto">
                        <div className="flex flex-wrap gap-1 rounded-xl border border-border/50 bg-muted/50 p-1">
                            {categories.map((cat) => {
                                const Icon = cat.icon;
                                const isActive = activeCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id as FilterCategory)}
                                        className={clsx(
                                            'flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider transition-all duration-300',
                                            isActive
                                                ? 'bg-background text-primary shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground',
                                        )}
                                    >
                                        <Icon
                                            className={clsx(
                                                'h-3.5 w-3.5',
                                                isActive
                                                    ? 'text-primary'
                                                    : 'text-muted-foreground/50',
                                            )}
                                        />
                                        {cat.label}
                                        {cat.count !== undefined && (
                                            <span
                                                className={clsx(
                                                    'ml-1 rounded-md px-1.5 py-0.5 text-[9px]',
                                                    isActive
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'bg-muted text-muted-foreground',
                                                )}
                                            >
                                                {cat.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Time Step Selector */}
                        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/50 p-1">
                            <div className="flex items-center gap-1.5 px-2 text-muted-foreground/60">
                                <Clock className="h-3.5 w-3.5" />
                            </div>
                            {slotOptions.map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => onSlotDurationChange(opt)}
                                    className={clsx(
                                        'rounded-lg px-2.5 py-1.5 text-[10px] font-black transition-all',
                                        slotDuration === opt
                                            ? 'bg-background text-primary shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {opt}м
                                </button>
                            ))}
                        </div>

                        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleBulkSelect(true)}
                                className="rounded-xl bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary transition-all hover:bg-primary/20"
                                title="Вибрати всіх у цій категорії"
                            >
                                Усіх у групі
                            </button>
                            <button
                                onClick={() => onStaffFilterChange(allStaff.map((s) => s.id))}
                                className="rounded-xl bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
                            >
                                Усіх
                            </button>
                            <button
                                onClick={() => onStaffFilterChange([])}
                                className="rounded-xl bg-muted px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted/80"
                            >
                                Очистити
                            </button>
                        </div>
                    </div>
                </div>

                {/* Staff Chips */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-shrink-0 items-center gap-2 border-r border-border/50 pr-2 text-muted-foreground/40">
                        <Filter className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                            Майстри
                        </span>
                    </div>

                    <div className="scrollbar-none flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1">
                        {filteredStaffList.length > 0 ? (
                            filteredStaffList.map((s) => {
                                const isSelected = selectedStaffIds.includes(s.id);
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => toggleStaff(s.id)}
                                        className={clsx(
                                            'group flex items-center gap-2.5 whitespace-nowrap rounded-xl border-2 px-3 py-1.5 transition-all duration-300',
                                            isSelected
                                                ? 'border-primary bg-primary/5 text-primary shadow-sm'
                                                : 'border-border/50 bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground',
                                        )}
                                    >
                                        <div
                                            className={clsx(
                                                'h-2 w-2 rounded-full transition-transform duration-300 group-hover:scale-125',
                                                isSelected ? 'bg-primary' : 'bg-muted',
                                            )}
                                        />
                                        <div className="flex flex-col items-start leading-none">
                                            <span className="font-heading text-xs font-bold">
                                                {s.name}
                                            </span>
                                            <span className="mt-0.5 text-[8px] font-black uppercase tracking-widest opacity-40">
                                                {getRoleLabel(s.role)}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-2 text-[10px] font-bold italic text-muted-foreground">
                                У цій категорії немає співробітників
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
