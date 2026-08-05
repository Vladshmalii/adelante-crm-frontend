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
        <div className="mx-4 overflow-x-auto rounded-2xl border border-border/50 bg-card shadow-sm">
            <table className="w-full text-left">
                <thead className="border-b border-border/50 bg-secondary/20">
                    <tr>
                        <th className="whitespace-nowrap px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Назва / Артикул
                        </th>
                        <th className="w-[200px] whitespace-nowrap px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Категорія
                        </th>
                        <th className="w-[120px] whitespace-nowrap px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Залишок
                        </th>
                        <th className="w-[140px] whitespace-nowrap px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Статус
                        </th>
                        <th className="w-[140px] whitespace-nowrap px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Собівартість
                        </th>
                        <th className="w-[140px] whitespace-nowrap px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Дії
                        </th>
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
                            <td
                                colSpan={6}
                                className="px-4 py-12 text-center font-medium text-muted-foreground"
                            >
                                Товарів не знайдено
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
