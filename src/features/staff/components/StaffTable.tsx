import { StaffTableHeader } from './StaffTableHeader';
import { StaffTableRow } from './StaffTableRow';
import type { Staff } from '../types';

interface StaffTableProps {
    staff: Staff[];
    selectedStaff: Set<string>;
    onToggleStaff: (staffId: string) => void;
    onToggleAll: () => void;
    onStaffClick: (staff: Staff) => void;
}

export function StaffTable({
    staff,
    selectedStaff,
    onToggleStaff,
    onToggleAll,
    onStaffClick,
}: StaffTableProps) {
    const allSelected = staff.length > 0 && selectedStaff.size === staff.length;

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
                            isSelected={selectedStaff.has(staffMember.id)}
                            onToggleSelect={() => onToggleStaff(staffMember.id)}
                            onStaffClick={() => onStaffClick(staffMember)}
                            isEven={index % 2 === 0}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
