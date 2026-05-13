import { MoreVertical, Edit2, Trash2, ArrowRightLeft } from 'lucide-react';
import { Product } from '../types';
import { PRODUCT_CATEGORIES, PRODUCT_TYPES, PRODUCT_UNITS } from '../constants';
import { Badge } from '@/shared/components/ui/Badge';

interface InventoryTableRowProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    onMovement: (product: Product) => void;
}

export function InventoryTableRow({ product, onEdit, onDelete, onMovement }: InventoryTableRowProps) {
    const categoryLabel = PRODUCT_CATEGORIES.find(c => c.value === product.category)?.label || product.category;
    const typeLabel = PRODUCT_TYPES.find(t => t.value === product.type)?.label || product.type;
    const unitLabel = PRODUCT_UNITS.find(u => u.value === product.unit)?.label || product.unit;

    const getStockStatus = () => {
        if (product.quantity === 0) return { label: 'Немає', variant: 'danger' as const };
        if (product.quantity <= product.minQuantity) return { label: 'Закінчується', variant: 'warning' as const };
        return { label: 'В наявності', variant: 'success' as const };
    };

    const status = getStockStatus();

    return (
        <tr className="border-b border-border/50 transition-all duration-300 hover:bg-primary/[0.02]">
            <td className="px-4 py-4">
                <div className="font-bold text-foreground">{product.name}</div>
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight opacity-70">{product.sku}</div>
            </td>
            <td className="px-4 py-4">
                <Badge variant="secondary" className="bg-secondary text-foreground/70 border-none font-bold text-[10px] uppercase">
                    {categoryLabel}
                </Badge>
            </td>
            <td className="px-4 py-4 text-sm font-medium text-foreground/70">{typeLabel}</td>
            <td className="px-4 py-4">
                <div className="font-black text-foreground">
                    {product.quantity} <span className="text-[10px] text-muted-foreground uppercase">{unitLabel}</span>
                </div>
            </td>
            <td className="px-4 py-4">
                <Badge 
                    variant={status.variant} 
                    className="font-black uppercase text-[10px] tracking-wider px-2 py-0.5"
                >
                    {status.label}
                </Badge>
            </td>
            <td className="px-4 py-4 text-sm font-black text-foreground">
                {product.costPrice.toLocaleString('uk-UA')} ₴
            </td>
            <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => onMovement(product)}
                        className="h-[42px] w-[42px] flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 rounded-xl bg-secondary/50 hover:bg-primary/10"
                        title="Рух товару"
                    >
                        <ArrowRightLeft size={20} />
                    </button>
                    <button
                        onClick={() => onEdit(product)}
                        className="h-[42px] w-[42px] flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 rounded-xl bg-secondary/50 hover:bg-primary/10"
                        title="Редагувати"
                    >
                        <Edit2 size={20} />
                    </button>
                    <button
                        onClick={() => onDelete(product)}
                        className="h-[42px] w-[42px] flex items-center justify-center text-muted-foreground hover:text-destructive transition-all duration-300 rounded-xl bg-secondary/50 hover:bg-destructive/10"
                        title="Видалити"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </td>
        </tr>
    );
}
