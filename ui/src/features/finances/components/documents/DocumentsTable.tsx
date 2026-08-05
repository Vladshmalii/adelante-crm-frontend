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
        <div className="mx-4 overflow-x-auto rounded-2xl border border-border/50 bg-card shadow-sm">
            <table className="w-full">
                <thead className="border-b border-border/50 bg-secondary/20">
                    <tr>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            №
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Дата
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Тип
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Вміст
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Сума
                        </th>
                        <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Послуг
                        </th>
                        <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Товарів
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Контрагент
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Коментар
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Автор
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Статус
                        </th>
                        <th className="px-4 py-4 text-right text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Дії
                        </th>
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
