import { Edit, Power } from 'lucide-react';
import { PaymentMethod } from '../../types';

interface PaymentMethodRowProps {
    method: PaymentMethod;
    onEdit: (method: PaymentMethod) => void;
    onToggle: (method: PaymentMethod) => void;
}

export function PaymentMethodRow({ method, onEdit, onToggle }: PaymentMethodRowProps) {
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
                {getTypeLabel(method.type)}
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {method.cashRegister}
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {getCommissionText()}
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {getCommissionPayerLabel(method.commissionPayer)}
            </td>
            <td className="px-4 py-3">
                {method.availableOnline ? (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
            Так
          </span>
                ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
            Ні
          </span>
                )}
            </td>
            <td className="px-4 py-3">
                {method.isActive ? (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
            Активний
          </span>
                ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700">
            Вимкнений
          </span>
                )}
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(method)}
                        className="p-1.5 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                        title="Редагувати"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => onToggle(method)}
                        className={`p-1.5 rounded transition-colors ${
                            method.isActive
                                ? 'hover:bg-red-100 hover:text-red-700'
                                : 'hover:bg-green-100 hover:text-green-700'
                        }`}
                        title={method.isActive ? 'Вимкнути' : 'Увімкнути'}
                    >
                        <Power size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
}