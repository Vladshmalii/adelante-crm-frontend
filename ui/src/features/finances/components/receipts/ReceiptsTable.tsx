import { FinanceReceipt } from '../../types';
import { ReceiptRow } from './ReceiptRow';

interface ReceiptsTableProps {
    receipts: FinanceReceipt[];
    onView: (receipt: FinanceReceipt) => void;
    onEdit: (receipt: FinanceReceipt) => void;
}

export function ReceiptsTable({ receipts, onView, onEdit }: ReceiptsTableProps) {
    return (
        <div className="mx-4 overflow-x-auto rounded-2xl border border-border/50 bg-card shadow-sm">
            <table className="w-full">
                <thead className="border-b border-border/50 bg-secondary/20">
                    <tr>
                        <th className="w-[60px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            #
                        </th>
                        <th className="w-[140px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Дата і час
                        </th>
                        <th className="w-[120px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            № чека
                        </th>
                        <th className="w-[120px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            № док.
                        </th>
                        <th className="w-[120px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Каса
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Клієнт
                        </th>
                        <th className="w-[100px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Сума
                        </th>
                        <th className="w-[120px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Метод
                        </th>
                        <th className="w-[120px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Статус
                        </th>
                        <th className="w-[100px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Залишок
                        </th>
                        <th className="w-[120px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Автор
                        </th>
                        <th className="w-[60px] px-4 py-4 text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Дж.
                        </th>
                        <th className="w-[100px] px-4 py-4 text-right text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
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
