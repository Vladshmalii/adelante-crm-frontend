import { StaffActionsMenu } from './StaffActionsMenu';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import type { Staff } from '../types';

interface StaffTableRowProps {
    staff: Staff;
    isSelected: boolean;
    onToggleSelect: () => void;
    onStaffClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
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
    onEdit,
    onDelete,
    isEven,
}: StaffTableRowProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const getMaskedPhone = (phone?: string) => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        if (digits.length <= 4) return digits;
        const last4 = digits.slice(-4);
        return `•••• ${last4}`;
    };

    const getPublicName = (firstName: string, middleName?: string) => {
        if (middleName) {
            return `${firstName} ${middleName}`;
        }
        return firstName;
    };

    return (
        <tr
            className={`
        border-b border-border transition-colors hover:bg-secondary/50
        ${isEven ? 'bg-background' : 'bg-secondary/30'}
      `}
        >
            <td className="px-4 py-3">
                <Checkbox
                    checked={isSelected}
                    onChange={onToggleSelect}
                />
            </td>
            <td className="px-4 py-3">
                <button
                    onClick={onStaffClick}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                    {getPublicName(staff.firstName, staff.middleName)}
                </button>
            </td>
            <td className="px-4 py-3 text-sm text-foreground">{getMaskedPhone(staff.phone)}</td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {staff.email ? 'Приховано' : '—'}
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
                <StaffActionsMenu
                    onView={onStaffClick}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </td>
        </tr>
    );
}
