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

export function InventoryTableRow({
    product,
    onEdit,
    onDelete,
    onMovement,
}: InventoryTableRowProps) {
    const categories = useInventoryStore((state) => state.categories);
    const categoryLabel =
        categories.find((c) => c.value === product.category)?.label || product.category;
    const unitLabel = PRODUCT_UNITS.find((u) => u.value === product.unit)?.label || product.unit;

    const getStockStatus = () => {
        if (product.quantity === 0) return { label: 'Немає', variant: 'danger' as const };
        if (product.quantity <= product.minQuantity)
            return { label: 'Закінчується', variant: 'warning' as const };
        return { label: 'В наявності', variant: 'success' as const };
    };

    const status = getStockStatus();

    const renderQuantity = () => {
        if (product.unit !== 'pcs' && product.packageVolume) {
            const packs = Math.floor(product.quantity / product.packageVolume);
            const remainder = product.quantity % product.packageVolume;

            return (
                <div className="flex flex-col">
                    <div className="whitespace-nowrap font-black text-foreground">
                        {packs}{' '}
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">
                            шт
                        </span>
                        {remainder > 0 && (
                            <span className="ml-1 opacity-80">
                                + {remainder}{' '}
                                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                                    {unitLabel}
                                </span>
                            </span>
                        )}
                    </div>
                    <div className="mt-0.5 text-[10px] font-medium text-muted-foreground opacity-70">
                        Всього: {product.quantity} {unitLabel}
                    </div>
                </div>
            );
        }

        return (
            <div className="whitespace-nowrap font-black text-foreground">
                {product.quantity}{' '}
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    {unitLabel}
                </span>
            </div>
        );
    };

    return (
        <tr className="border-b border-border/50 transition-all duration-300 hover:bg-primary/[0.02]">
            <td className="px-5 py-4">
                <div className="text-sm font-bold text-foreground">{product.name}</div>
                <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-60">
                    {product.sku}
                </div>
            </td>
            <td className="px-5 py-4">
                <span className="inline-flex items-center whitespace-nowrap rounded-md bg-secondary/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground/80">
                    {categoryLabel}
                </span>
            </td>
            <td className="px-5 py-4">{renderQuantity()}</td>
            <td className="px-5 py-4">
                <Badge
                    variant={status.variant}
                    className="whitespace-nowrap px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                >
                    {status.label}
                </Badge>
            </td>
            <td className="whitespace-nowrap px-5 py-4 text-sm font-black text-foreground">
                {product.costPrice.toLocaleString('uk-UA')} ₴
            </td>
            <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => onMovement(product)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                        title="Рух товару"
                    >
                        <ArrowRightLeft size={16} />
                    </button>
                    <button
                        onClick={() => onEdit(product)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                        title="Редагувати"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(product)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive"
                        title="Видалити"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
}
