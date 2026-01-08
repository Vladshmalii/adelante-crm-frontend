"use client";

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { DocumentsFilters } from './DocumentsFilters';
import { DocumentsTable } from './DocumentsTable';
import { FinanceDocument } from '../../types';
import { Button } from '@/shared/components/ui/Button';
import { CreateDocumentModal } from '../../modals/CreateDocumentModal';
import { EditDocumentModal } from '../../modals/EditDocumentModal';
import { DocumentDetailsModal } from '../../modals/DocumentDetailsModal';
import { useFinances } from '../../hooks/useFinances';
import { GlobalLoader } from '@/shared/components/ui/GlobalLoader';
import { useToast } from '@/shared/hooks/useToast';
import { USE_MOCK_DATA } from '@/lib/config';

export function DocumentsView() {
    const [dateFrom, setDateFrom] = useState('2025-12-29');
    const [dateTo, setDateTo] = useState('2026-01-04');
    const [documentType, setDocumentType] = useState('all');
    const [contentType, setContentType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<FinanceDocument | null>(null);
    const [isLocalLoading, setIsLocalLoading] = useState(false);
    const toast = useToast();

    const {
        documents,
        isLoading,
        error,
        loadDocuments,
        createDocument,
    } = useFinances({});

    useEffect(() => {
        if (error) toast.error('Помилка', error);
    }, [error, toast]);

    useEffect(() => {
        loadDocuments({
            dateFrom,
            dateTo,
            type: documentType === 'all' ? undefined : documentType,
            status: undefined,
        });
    }, [dateFrom, dateTo, documentType, loadDocuments]);

    const handleApply = () => {
        loadDocuments({
            dateFrom,
            dateTo,
            type: documentType === 'all' ? undefined : documentType,
            status: undefined,
        });
    };

    const handleCreateDocument = async (data: Omit<FinanceDocument, 'id'>) => {
        setIsLocalLoading(true);
        try {
            await createDocument(data);
            toast.success('Документ створено', 'Успіх');
            setIsCreateModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error('Помилка', err instanceof Error ? err.message : 'Не вдалося створити документ');
        } finally {
            setIsLocalLoading(false);
        }
    };

    const handleOpenDetails = (document: FinanceDocument) => {
        setSelectedDocument(document);
        setIsDetailsModalOpen(true);
    };

    const handleOpenEdit = (document: FinanceDocument) => {
        setSelectedDocument(document);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = () => {
        toast.info('Редагування', USE_MOCK_DATA ? 'Демо режим: зміни не зберігаються' : 'API не підтримує оновлення документів');
        setIsEditModalOpen(false);
        setSelectedDocument(null);
    };

    const filteredDocuments = useMemo(() => {
        let result = [...documents];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter((d) => d.number.toLowerCase().includes(q) || (d.counterparty || '').toLowerCase().includes(q));
        }
        if (contentType !== 'all') {
            result = result.filter((d) => d.contentType === contentType);
        }
        return result;
    }, [documents, searchQuery, contentType]);

    return (
        <div className="flex flex-col h-full">
            <GlobalLoader isLoading={isLoading || isLocalLoading} />
            <div className="p-4 border-b border-border bg-card flex justify-between items-center">
                <h2 className="text-lg font-semibold font-heading">Документи</h2>
                <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Створити документ
                </Button>
            </div>

            <DocumentsFilters
                dateFrom={dateFrom}
                dateTo={dateTo}
                documentType={documentType}
                contentType={contentType}
                searchQuery={searchQuery}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onDocumentTypeChange={setDocumentType}
                onContentTypeChange={setContentType}
                onSearchQueryChange={setSearchQuery}
                onApply={handleApply}
            />
            <div className="flex-1 overflow-auto">
                <DocumentsTable
                    documents={filteredDocuments}
                    onView={handleOpenDetails}
                    onEdit={handleOpenEdit}
                />
            </div>

            <CreateDocumentModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleCreateDocument}
            />

            <EditDocumentModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                document={selectedDocument}
                onSave={handleSaveEdit}
            />

            <DocumentDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                document={selectedDocument}
            />
        </div>
    );
}