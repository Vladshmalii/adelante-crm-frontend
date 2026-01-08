import { StaffTableHeader } from './StaffTableHeader';
import { StaffTableRow } from './StaffTableRow';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Users } from 'lucide-react';
import type { Staff } from '../types';

interface StaffTableProps {
    staff: Staff[];
    selectedStaff: Set<string>;
    onToggleStaff: (staffId: string) => void;
    onToggleAll: () => void;
    onStaffClick: (staff: Staff) => void;
    onEditStaff: (staff: Staff) => void;
    onDeleteStaff: (staff: Staff) => void;
    onScheduleStaff: (staff: Staff) => void;
    onStatisticsStaff: (staff: Staff) => void;
}

export function StaffTable({
    staff,
    selectedStaff,
    onToggleStaff,
    onToggleAll,
    onStaffClick,
    onEditStaff,
    onDeleteStaff,
    onScheduleStaff,
    onStatisticsStaff,
}: StaffTableProps) {
    const allSelected = staff.length > 0 && selectedStaff.size === staff.length;

    if (staff.length === 0) {
        return (
            <EmptyState
                icon={<Users className="w-8 h-8" />}
                title="Немає співробітників"
                description="У цьому розділі ще немає співробітників. Спробуйте змінити фільтри або додайте нового співробітника."
            />
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full">
                <StaffTableHeader
                    allSelected={allSelected}
                    onToggleAll={onToggleAll}
                />
                <tbody>
                    {staff.map((staffMember, index) => (
                        <StaffTableRow
                            key={staffMember.id}
                            staff={staffMember}
                            isSelected={selectedStaff.has(String(staffMember.id))}
                            onToggleSelect={() => onToggleStaff(String(staffMember.id))}
                            onStaffClick={() => onStaffClick(staffMember)}
                            onEdit={() => onEditStaff(staffMember)}
                            onDelete={() => onDeleteStaff(staffMember)}
                            onSchedule={() => onScheduleStaff(staffMember)}
                            onStatistics={() => onStatisticsStaff(staffMember)}
                            isEven={index % 2 === 0}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
