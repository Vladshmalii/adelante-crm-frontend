import { MoreVertical } from 'lucide-react';
import type { Staff } from '../types';

interface StaffTableRowProps {
    staff: Staff;
    isSelected: boolean;
    onToggleSelect: () => void;
    onStaffClick: () => void;
    isEven: boolean;
}

const ROLE_LABELS: Record<string, string> = {
    master: 'Майстер',
    administrator: 'Адміністратор',
    manager: 'Менеджер',
};

export function StaffTableRow({
    staff,
    isSelected,
    onToggleSelect,
    onStaffClick,
    isEven,
}: StaffTableRowProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    return (
        <tr
            className={`
        border-b border-border transition-colors hover:bg-secondary/50
        ${isEven ? 'bg-background' : 'bg-secondary/30'}
      `}
        >
            <td className="px-4 py-3">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggleSelect}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-ring cursor-pointer"
                />
            </td>
            <td className="px-4 py-3">
                <button
                    onClick={onStaffClick}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                    {staff.name}
                </button>
            </td>
            <td className="px-4 py-3 text-sm text-foreground">{staff.phone}</td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {staff.email || '—'}
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
                {ROLE_LABELS[staff.role]}
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {staff.specialization || '—'}
            </td>
            <td className="px-4 py-3 text-sm font-medium text-foreground">
                {staff.salary.toLocaleString('uk-UA')} ₴
            </td>
            <td className="px-4 py-3 text-sm text-foreground">{staff.commission}%</td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {formatDate(staff.hireDate)}
            </td>
            <td className="px-4 py-3">
                <button
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Дії"
                >
                    <MoreVertical size={18} />
                </button>
            </td>
        </tr>
    );
}
