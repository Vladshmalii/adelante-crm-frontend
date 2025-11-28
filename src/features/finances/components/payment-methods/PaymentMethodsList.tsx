import { PaymentMethod } from '../../types';
import { PaymentMethodRow } from './PaymentMethodRow';

interface PaymentMethodsListProps {
    methods: PaymentMethod[];
    onEdit: (method: PaymentMethod) => void;
    onToggle: (method: PaymentMethod) => void;
}

export function PaymentMethodsList({ methods, onEdit, onToggle }: PaymentMethodsListProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-secondary/50">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Назва методу
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Тип
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Каса / Рахунок
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Комісія
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Хто сплачує
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Онлайн-запис
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Статус
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Дії
                    </th>
                </tr>
                </thead>
                <tbody>
                {methods.map((method) => (
                    <PaymentMethodRow
                        key={method.id}
                        method={method}
                        onEdit={onEdit}
                        onToggle={onToggle}
                    />
                ))}
                </tbody>
            </table>
        </div>
    );
}