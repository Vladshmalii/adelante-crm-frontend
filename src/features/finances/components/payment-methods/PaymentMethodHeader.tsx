import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

interface PaymentMethodHeaderProps {
    onAddClick: () => void;
}

export function PaymentMethodHeader({
    onAddClick,
}: PaymentMethodHeaderProps) {
    return (
        <div className="p-4 border-b border-border/50 bg-card flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold font-heading text-foreground">Методи оплат</h2>
            <div className="flex items-center gap-3">
                <Button 
                    onClick={onAddClick} 
                    variant="primary"
                    className="h-[42px] px-6 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    Додати метод
                </Button>
            </div>
        </div>
    );
}