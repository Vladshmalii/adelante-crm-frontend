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
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-left">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-medium">
                    <tr>
                        <th className="px-4 py-3">Назва / Артикул</th>
                        <th className="px-4 py-3">Категорія</th>
                        <th className="px-4 py-3">Тип</th>
                        <th className="px-4 py-3">Залишок</th>
                        <th className="px-4 py-3">Статус</th>
                        <th className="px-4 py-3">Собівартість</th>
                        <th className="px-4 py-3 w-[120px]">Дії</th>
                    </tr>
                </thead>
                <tbody>
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
                            <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                Товарів не знайдено
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
