import { Edit, Power, Trash2 } from 'lucide-react';
import { PaymentMethod } from '../../types';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import clsx from 'clsx';

interface PaymentMethodRowProps {
    method: PaymentMethod;
    onEdit: (method: PaymentMethod) => void;
    onToggle: (method: PaymentMethod) => void;
    onDelete: (method: PaymentMethod) => void;
}

export function PaymentMethodRow({ method, onEdit, onToggle, onDelete }: PaymentMethodRowProps) {
    const getTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            cash: 'Офлайн',
            card: 'Офлайн',
            online: 'Онлайн',
            certificate: 'Внутрішній',
            bonus: 'Внутрішній',
            tips: 'Офлайн',
            other: 'Інше',
        };
        return types[type] || type;
    };

    const getCommissionText = () => {
        if (method.commissionType === 'none') return 'Без комісії';
        if (method.commissionType === 'percentage') return `${method.commissionValue}%`;
        return `₴ ${method.commissionValue}`;
    };

    const getCommissionPayerLabel = (payer: string) => {
        const payers: Record<string, string> = {
            client: 'Клієнт',
            salon: 'Салон',
            split: 'Поровну',
        };
        return payers[payer] || payer;
    };

    return (
        <tr className="border-b border-border hover:bg-secondary/50 transition-colors">
            <td className="px-4 py-3 text-sm font-medium text-foreground">
                {method.name}
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {getTypeLabel(method.type || '')}
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {method.cashRegister}
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {getCommissionText()}
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {getCommissionPayerLabel(method.commissionPayer || 'client')}
            </td>
            <td className="px-4 py-3">
                {method.availableOnline ? (
                    <Badge variant="success" className="font-black uppercase text-[10px] px-2.5 py-1 tracking-wider">Так</Badge>
                ) : (
                    <Badge variant="default" className="font-black uppercase text-[10px] px-2.5 py-1 tracking-wider">Ні</Badge>
                )}
            </td>
            <td className="px-4 py-3">
                <Badge 
                    variant={method.isActive ? 'success' : 'danger'} 
                    className="font-black uppercase text-[10px] px-2.5 py-1 tracking-wider"
                >
                    {method.isActive ? 'Активний' : 'Вимкнений'}
                </Badge>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 p-0 rounded-xl bg-secondary/50 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                        onClick={() => onEdit(method)}
                        title="Редагувати"
                    >
                        <Edit size={20} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={clsx(
                            "h-10 w-10 p-0 rounded-xl bg-secondary/50 transition-all duration-300",
                            method.isActive 
                                ? "hover:bg-red-100 hover:text-red-700" 
                                : "hover:bg-green-100 hover:text-green-700"
                        )}
                        onClick={() => onToggle(method)}
                        title={method.isActive ? 'Вимкнути' : 'Увімкнути'}
                    >
                        <Power size={20} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 p-0 rounded-xl bg-secondary/50 hover:bg-red-100 hover:text-red-700 transition-all duration-300"
                        onClick={() => onDelete(method)}
                        title="Видалити"
                    >
                        <Trash2 size={20} />
                    </Button>
                </div>
            </td>
        </tr>
    );
}