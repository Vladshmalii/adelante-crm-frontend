import { FinanceReceipt } from '../../types';
import { ReceiptRow } from './ReceiptRow';

interface ReceiptsTableProps {
    receipts: FinanceReceipt[];
    onView: (receipt: FinanceReceipt) => void;
    onEdit: (receipt: FinanceReceipt) => void;
}

export function ReceiptsTable({ receipts, onView, onEdit }: ReceiptsTableProps) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card shadow-sm mx-4">
            <table className="w-full">
                <thead className="bg-secondary/20 border-b border-border/50">
                    <tr>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[60px]">
                            #
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[140px]">
                            Дата і час
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[120px]">
                            № чека
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[120px]">
                            № док.
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[120px]">
                            Каса
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                            Клієнт
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[100px]">
                            Сума
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[120px]">
                            Метод
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[120px]">
                            Статус
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[100px]">
                            Залишок
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[120px]">
                            Автор
                        </th>
                        <th className="px-4 py-4 text-center text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[60px]">
                            Дж.
                        </th>
                        <th className="px-4 py-4 text-right text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[100px]">
                            Дії
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                    {receipts.map((receipt) => (
                        <ReceiptRow
                            key={receipt.id}
                            receipt={receipt}
                            onView={onView}
                            onEdit={onEdit}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}