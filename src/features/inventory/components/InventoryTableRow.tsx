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
        <tr className="border-b border-border hover:bg-muted/50 transition-colors">
            <td className="px-4 py-3">
                <div className="font-medium text-foreground">{product.name}</div>
                <div className="text-xs text-muted-foreground">{product.sku}</div>
            </td>
            <td className="px-4 py-3 text-sm text-foreground">{categoryLabel}</td>
            <td className="px-4 py-3 text-sm text-foreground">{typeLabel}</td>
            <td className="px-4 py-3">
                <div className="font-medium text-foreground">
                    {product.quantity} {unitLabel}
                </div>
            </td>
            <td className="px-4 py-3">
                <Badge variant={status.variant} size="sm">
                    {status.label}
                </Badge>
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
                {product.costPrice} ₴
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onMovement(product)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Рух товару"
                    >
                        <ArrowRightLeft size={16} />
                    </button>
                    <button
                        onClick={() => onEdit(product)}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                        title="Редагувати"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(product)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        title="Видалити"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
}
