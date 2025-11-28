'use client';

import { Filter, X } from 'lucide-react';
import { StaffMember } from '../types';
import { Button } from '@/shared/components/ui/Button';
import clsx from 'clsx';

interface CalendarFiltersProps {
    staff: StaffMember[];
    selectedStaffIds: string[];
    onStaffFilterChange: (staffIds: string[]) => void;
}

export function CalendarFilters({
    staff,
    selectedStaffIds,
    onStaffFilterChange,
}: CalendarFiltersProps) {
    const toggleStaff = (staffId: string) => {
        if (selectedStaffIds.includes(staffId)) {
            onStaffFilterChange(selectedStaffIds.filter((id) => id !== staffId));
        } else {
            onStaffFilterChange([...selectedStaffIds, staffId]);
        }
    };

    const selectAll = () => {
        onStaffFilterChange(staff.map((s) => s.id));
    };

    const clearAll = () => {
        onStaffFilterChange([]);
    };

    return (
        <div className="bg-card border-b border-border px-3 sm:px-6 py-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Filter className="w-4 h-4 text-primary" />
                    <span>Фільтри:</span>
                </div>

                <div className="flex items-start sm:items-center gap-2 flex-1 w-full sm:w-auto overflow-x-auto">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Майстри:</span>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {staff.map((staffMember) => (
                            <button
                                key={staffMember.id}
                                onClick={() => toggleStaff(staffMember.id)}
                                className={clsx(
                                    'px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95 whitespace-nowrap',
                                    selectedStaffIds.includes(staffMember.id)
                                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                            >
                                {staffMember.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <Button size="sm" variant="ghost" onClick={selectAll}>
                        <span className="hidden sm:inline">Всі</span>
                        <span className="sm:hidden text-xs">Всі</span>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={clearAll}>
                        <X className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Очистити</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}