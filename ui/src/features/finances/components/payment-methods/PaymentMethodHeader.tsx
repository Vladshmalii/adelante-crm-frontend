import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

interface PaymentMethodHeaderProps {
    onAddClick: () => void;
}

export function PaymentMethodHeader({ onAddClick }: PaymentMethodHeaderProps) {
    return (
        <div className="mb-6 flex items-center justify-between border-b border-border/50 bg-card p-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">Методи оплат</h2>
            <div className="flex items-center gap-3">
                <Button
                    onClick={onAddClick}
                    variant="primary"
                    className="flex h-[42px] items-center gap-2 rounded-xl px-6 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    Додати метод
                </Button>
            </div>
        </div>
    );
}
