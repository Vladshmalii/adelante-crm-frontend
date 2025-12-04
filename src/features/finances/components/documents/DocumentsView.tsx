"use client";

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DocumentsFilters } from './DocumentsFilters';
import { DocumentsTable } from './DocumentsTable';
import { mockDocuments } from '../../data/mockDocuments';
import { FinanceDocument } from '../../types';
import { Button } from '@/shared/components/ui/Button';
import { CreateDocumentModal } from '../../modals/CreateDocumentModal';
import { EditDocumentModal } from '../../modals/EditDocumentModal';
import { DocumentDetailsModal } from '../../modals/DocumentDetailsModal';

export function DocumentsView() {
    const [dateFrom, setDateFrom] = useState('2025-11-22');
    const [dateTo, setDateTo] = useState('2025-11-28');
    const [documentType, setDocumentType] = useState('all');
    const [contentType, setContentType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<FinanceDocument | null>(null);

    const handleApply = () => {
        console.log('Applying filters...');
    };

    const handleCreateDocument = (data: Omit<FinanceDocument, 'id'>) => {
        console.log('Create document:', data);
    };

    const handleOpenDetails = (document: FinanceDocument) => {
        setSelectedDocument(document);
        setIsDetailsModalOpen(true);
    };

    const handleOpenEdit = (document: FinanceDocument) => {
        setSelectedDocument(document);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = (data: FinanceDocument) => {
        console.log('Edit document:', data);
        setIsEditModalOpen(false);
        setSelectedDocument(null);
    };

    return (
        <div className="flex flex-col h-full">
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
                    documents={mockDocuments}
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