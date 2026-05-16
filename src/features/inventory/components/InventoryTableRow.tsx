import { MoreVertical, Edit2, Trash2, ArrowRightLeft } from 'lucide-react';
import { Product } from '../types';
import { PRODUCT_UNITS } from '../constants';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { Badge } from '@/shared/components/ui/Badge';

interface InventoryTableRowProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    onMovement: (product: Product) => void;
}

export function InventoryTableRow({ product, onEdit, onDelete, onMovement }: InventoryTableRowProps) {
    const categories = useInventoryStore(state => state.categories);
    const categoryLabel = categories.find(c => c.value === product.category)?.label || product.category;
    const unitLabel = PRODUCT_UNITS.find(u => u.value === product.unit)?.label || product.unit;

    const getStockStatus = () => {
        if (product.quantity === 0) return { label: 'Немає', variant: 'danger' as const };
        if (product.quantity <= product.minQuantity) return { label: 'Закінчується', variant: 'warning' as const };
        return { label: 'В наявності', variant: 'success' as const };
    };

    const status = getStockStatus();

    const renderQuantity = () => {
        if (product.unit !== 'pcs' && product.packageVolume) {
            const packs = Math.floor(product.quantity / product.packageVolume);
            const remainder = product.quantity % product.packageVolume;
            
            return (
                <div className="flex flex-col">
                    <div className="font-black text-foreground whitespace-nowrap">
                        {packs} <span className="text-[10px] text-muted-foreground uppercase font-bold">шт</span>
                        {remainder > 0 && (
                            <span className="ml-1 opacity-80">
                                + {remainder} <span className="text-[10px] text-muted-foreground uppercase font-bold">{unitLabel}</span>
                            </span>
                        )}
                    </div>
                    <div className="text-[10px] font-medium text-muted-foreground mt-0.5 opacity-70">
                        Всього: {product.quantity} {unitLabel}
                    </div>
                </div>
            );
        }

        return (
            <div className="font-black text-foreground whitespace-nowrap">
                {product.quantity} <span className="text-[10px] text-muted-foreground uppercase font-bold">{unitLabel}</span>
            </div>
        );
    };

    return (
        <tr className="border-b border-border/50 transition-all duration-300 hover:bg-primary/[0.02]">
            <td className="px-5 py-4">
                <div className="font-bold text-foreground text-sm">{product.name}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-60 mt-0.5">{product.sku}</div>
            </td>
            <td className="px-5 py-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary/30 text-foreground/80 font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">
                    {categoryLabel}
                </span>
            </td>
            <td className="px-5 py-4">
                {renderQuantity()}
            </td>
            <td className="px-5 py-4">
                <Badge 
                    variant={status.variant} 
                    className="font-black uppercase text-[10px] tracking-wider px-2 py-0.5 whitespace-nowrap"
                >
                    {status.label}
                </Badge>
            </td>
            <td className="px-5 py-4 text-sm font-black text-foreground whitespace-nowrap">
                {product.costPrice.toLocaleString('uk-UA')} ₴
            </td>
            <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => onMovement(product)}
                        className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 rounded-xl bg-secondary/50 hover:bg-primary/10"
                        title="Рух товару"
                    >
                        <ArrowRightLeft size={16} />
                    </button>
                    <button
                        onClick={() => onEdit(product)}
                        className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 rounded-xl bg-secondary/50 hover:bg-primary/10"
                        title="Редагувати"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(product)}
                        className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-destructive transition-all duration-300 rounded-xl bg-secondary/50 hover:bg-destructive/10"
                        title="Видалити"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
}
