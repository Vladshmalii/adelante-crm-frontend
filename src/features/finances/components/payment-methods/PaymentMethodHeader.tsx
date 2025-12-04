import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

interface PaymentMethodHeaderProps {
    onAddClick: () => void;
}

export function PaymentMethodHeader({
    onAddClick,
}: PaymentMethodHeaderProps) {
    return (
        <div className="p-4 sm:p-6 border-b border-border bg-card">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground font-heading">Методи оплат</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Налаштування доступних методів оплати для клієнтів
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={onAddClick} className="flex items-center gap-2">
                        <Plus size={18} />
                        Додати метод оплати
                    </Button>
                </div>
            </div>
        </div>
    );
}