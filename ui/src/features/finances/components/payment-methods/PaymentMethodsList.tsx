import { PaymentMethod } from '../../types';
import { PaymentMethodRow } from './PaymentMethodRow';

interface PaymentMethodsListProps {
    methods: PaymentMethod[];
    onEdit: (method: PaymentMethod) => void;
    onToggle: (method: PaymentMethod) => void;
    onDelete: (method: PaymentMethod) => void;
}

export function PaymentMethodsList({
    methods,
    onEdit,
    onToggle,
    onDelete,
}: PaymentMethodsListProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-secondary/50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Назва методу
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Тип
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Каса / Рахунок
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Комісія
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Хто сплачує
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Онлайн-запис
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Статус
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
                            onDelete={onDelete}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
