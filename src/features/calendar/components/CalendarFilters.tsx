'use client';

import { useState, useMemo } from 'react';
import { Filter, Users, CalendarDays, ShieldCheck, Briefcase, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { StaffMember, Appointment } from '../types';
import clsx from 'clsx';
import { getRoleLabel } from '@/features/staff/utils/roleTranslations';

interface CalendarFiltersProps {
    allStaff: StaffMember[];
    selectedStaffIds: string[];
    onStaffFilterChange: (staffIds: string[]) => void;
    appointments: Appointment[];
}

type FilterCategory = 'all' | 'today' | 'masters' | 'admin';

export function CalendarFilters({
    allStaff,
    selectedStaffIds,
    onStaffFilterChange,
    appointments,
}: CalendarFiltersProps) {
    const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');

    // Identify who works today (has appointments)
    const workingTodayIds = useMemo(() => {
        const ids = new Set<string>();
        appointments.forEach(apt => {
            if (apt.staffId) ids.add(apt.staffId.toString());
        });
        return ids;
    }, [appointments]);

    // Filter staff members based on category
    const filteredStaffList = useMemo(() => {
        switch (activeCategory) {
            case 'today':
                return allStaff.filter(s => workingTodayIds.has(s.id));
            case 'masters':
                return allStaff.filter(s => s.role === 'master');
            case 'admin':
                return allStaff.filter(s => s.role === 'administrator' || s.role === 'manager');
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
            const visibleIds = filteredStaffList.map(s => s.id);
            const newSelection = Array.from(new Set([...selectedStaffIds, ...visibleIds]));
            onStaffFilterChange(newSelection);
        } else {
            // Remove all currently visible staff from selection
            const visibleIds = new Set(filteredStaffList.map(s => s.id));
            const newSelection = selectedStaffIds.filter(id => !visibleIds.has(id));
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
        <div className="bg-background/80 backdrop-blur-md border-b border-border/50 px-4 sm:px-8 py-4 sticky top-20 z-20 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)]">
            <div className="w-full space-y-4">
                {/* Categories & Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        <div className="flex flex-wrap bg-muted/50 p-1 rounded-xl border border-border/50 gap-1">
                            {categories.map((cat) => {
                                const Icon = cat.icon;
                                const isActive = activeCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id as FilterCategory)}
                                        className={clsx(
                                            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300",
                                            isActive
                                                ? "bg-background text-primary shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Icon className={clsx("w-3.5 h-3.5", isActive ? "text-primary" : "text-muted-foreground/50")} />
                                        {cat.label}
                                        {cat.count !== undefined && (
                                            <span className={clsx(
                                                "ml-1 px-1.5 py-0.5 rounded-md text-[9px]",
                                                isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                            )}>
                                                {cat.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => handleBulkSelect(true)}
                            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            title="Вибрати всіх у цій категорії"
                        >
                            Усіх у групі
                        </button>
                        <button
                            onClick={() => onStaffFilterChange(allStaff.map(s => s.id))}
                            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
                        >
                            Усіх
                        </button>
                        <div className="w-px h-4 bg-border mx-1" />
                        <button
                            onClick={() => onStaffFilterChange([])}
                            className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            Очистити
                        </button>
                    </div>
                </div>

                {/* Staff Chips */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-shrink-0 flex items-center gap-2 text-muted-foreground/40 pr-2 border-r border-border/50">
                        <Filter className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Майстри</span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 flex-1 min-w-0">
                        {filteredStaffList.length > 0 ? (
                            filteredStaffList.map((s) => {
                                const isSelected = selectedStaffIds.includes(s.id);
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => toggleStaff(s.id)}
                                        className={clsx(
                                            "group flex items-center gap-2.5 px-3 py-1.5 rounded-xl border-2 transition-all duration-300 whitespace-nowrap",
                                            isSelected
                                                ? "bg-primary/5 border-primary text-primary shadow-sm"
                                                : "bg-background border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-2 h-2 rounded-full transition-transform duration-300 group-hover:scale-125",
                                            isSelected ? "bg-primary" : "bg-muted"
                                        )} />
                                        <div className="flex flex-col items-start leading-none">
                                            <span className="text-xs font-bold font-heading">{s.name}</span>
                                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-0.5">
                                                {getRoleLabel(s.role)}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="text-[10px] font-bold text-muted-foreground italic px-2">
                                У цій категорії немає співробітників
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}