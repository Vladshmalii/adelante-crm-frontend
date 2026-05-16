import { Product } from '../types';
import { InventoryTableRow } from './InventoryTableRow';

interface InventoryTableProps {
    products: Product[];
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    onMovement: (product: Product) => void;
}

export function InventoryTable({ products, onEdit, onDelete, onMovement }: InventoryTableProps) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card shadow-sm mx-4">
            <table className="w-full text-left">
                <thead className="bg-secondary/20 border-b border-border/50">
                    <tr>
                        <th className="px-5 py-4 text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest whitespace-nowrap">Назва / Артикул</th>
                        <th className="px-5 py-4 text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest whitespace-nowrap w-[200px]">Категорія</th>
                        <th className="px-5 py-4 text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest whitespace-nowrap w-[120px]">Залишок</th>
                        <th className="px-5 py-4 text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest whitespace-nowrap w-[140px]">Статус</th>
                        <th className="px-5 py-4 text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest whitespace-nowrap w-[140px]">Собівартість</th>
                        <th className="px-5 py-4 text-right text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest whitespace-nowrap w-[140px]">Дії</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                    {products.length > 0 ? (
                        products.map((product) => (
                            <InventoryTableRow
                                key={product.id}
                                product={product}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onMovement={onMovement}
                            />
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground font-medium">
                                Товарів не знайдено
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
