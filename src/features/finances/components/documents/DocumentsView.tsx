'use client';

import { useState } from 'react';
import { DocumentsFilters } from './DocumentsFilters';
import { DocumentsTable } from './DocumentsTable';
import { mockDocuments } from '../../data/mockDocuments';

export function DocumentsView() {
    const [dateFrom, setDateFrom] = useState('2025-11-22');
    const [dateTo, setDateTo] = useState('2025-11-28');
    const [documentType, setDocumentType] = useState('all');
    const [contentType, setContentType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const handleApply = () => {
        console.log('Applying filters...');
    };

    return (
        <div className="flex flex-col h-full">
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
                <DocumentsTable documents={mockDocuments} />
            </div>
        </div>
    );
}