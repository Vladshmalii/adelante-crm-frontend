import { FinanceDocument } from '../../types';
import type { FinanceDocument as ApiFinanceDocument } from '@/lib/api/finances';
type DocumentLike = FinanceDocument | ApiFinanceDocument;
import { DocumentRow } from './DocumentRow';

interface DocumentsTableProps {
    documents: DocumentLike[];
    onView: (document: DocumentLike) => void;
    onEdit: (document: DocumentLike) => void;
}

export function DocumentsTable({ documents, onView, onEdit }: DocumentsTableProps) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card shadow-sm mx-4">
            <table className="w-full">
                <thead className="bg-secondary/20 border-b border-border/50">
                    <tr>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">№</th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Дата</th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Тип</th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Вміст</th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Сума</th>
                        <th className="px-4 py-4 text-center text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Послуг</th>
                        <th className="px-4 py-4 text-center text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Товарів</th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Контрагент</th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Коментар</th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Автор</th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Статус</th>
                        <th className="px-4 py-4 text-right text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Дії</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                    {documents.map((document) => (
                        <DocumentRow
                            key={document.id}
                            document={document}
                            onView={onView}
                            onEdit={onEdit}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}