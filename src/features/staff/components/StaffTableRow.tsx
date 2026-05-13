import { StaffActionsMenu } from './StaffActionsMenu';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import type { Staff } from '../types';
import { getRoleLabel } from '../utils/roleTranslations';
import { Badge } from '@/shared/components/ui/Badge';
import clsx from 'clsx';

interface StaffTableRowProps {
    staff: Staff;
    isSelected: boolean;
    onToggleSelect: () => void;
    onStaffClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onSchedule: () => void;
    onStatistics: () => void;
    isEven: boolean;
}

export function StaffTableRow({
    staff,
    isSelected,
    onToggleSelect,
    onStaffClick,
    onEdit,
    onDelete,
    onSchedule,
    onStatistics,
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
            className={clsx(
                'border-b border-border/50 transition-all duration-300 hover:bg-primary/[0.02]',
                isEven ? 'bg-background' : 'bg-secondary/20'
            )}
        >
            <td className="px-4 py-4">
                <Checkbox
                    checked={isSelected}
                    onChange={onToggleSelect}
                />
            </td>
            <td className="px-4 py-4">
                <button
                    onClick={onStaffClick}
                    className="text-sm font-bold text-foreground hover:text-primary transition-colors text-left"
                >
                    {getPublicName(staff.firstName, staff.middleName)}
                </button>
            </td>
            <td className="px-4 py-4 text-sm font-medium text-foreground/80">{getMaskedPhone(staff.phone)}</td>
            <td className="px-4 py-4 text-sm text-muted-foreground hidden xl:table-cell">
                {staff.email ? '••••' : '—'}
            </td>
            <td className="px-4 py-4 hidden md:table-cell">
                <Badge variant="primary" className="bg-primary/10 text-primary border-none font-bold uppercase text-[10px] tracking-wider">
                    {getRoleLabel(staff.role)}
                </Badge>
            </td>
            <td className="px-4 py-4 text-sm text-muted-foreground hidden lg:table-cell">
                {staff.specialization || '—'}
            </td>
            <td className="px-4 py-4 text-sm font-black text-foreground hidden lg:table-cell">
                {staff.salary !== undefined ? `₴ ${staff.salary.toLocaleString('uk-UA')}` : '—'}
            </td>
            <td className="px-4 py-4 text-sm font-bold text-foreground hidden xl:table-cell text-center">{staff.commission}%</td>
            <td className="px-4 py-4 text-[11px] font-medium text-muted-foreground hidden xl:table-cell">
                {staff.hireDate ? formatDate(staff.hireDate) : '—'}
            </td>
            <td className="px-4 py-4 text-right">
                <StaffActionsMenu
                    onView={onStaffClick}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onSchedule={onSchedule}
                    onStatistics={onStatistics}
                />
            </td>
        </tr>
    );
}
