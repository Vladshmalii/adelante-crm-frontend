import { Upload, FileSpreadsheet } from 'lucide-react';
import { useState, useRef } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';

interface ImportExcelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (file: File) => void;
}

export function ImportExcelModal({ isOpen, onClose, onImport }: ImportExcelModalProps) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                setSelectedFile(file);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmit = () => {
        if (selectedFile) {
            onImport(selectedFile);
            onClose();
            setSelectedFile(null);
        }
    };

    const handleBrowse = () => {
        fileInputRef.current?.click();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Завантажити з Excel" size="sm">
            <div className="space-y-4">
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }
            `}
                >
                    {selectedFile ? (
                        <div className="flex flex-col items-center gap-3">
                            <FileSpreadsheet size={48} className="text-primary" />
                            <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>
                            <button
                                onClick={() => setSelectedFile(null)}
                                className="text-sm text-destructive hover:text-destructive/80 transition-colors"
                            >
                                Видалити
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <Upload size={48} className="text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium text-foreground mb-1">
                                    Перетягніть файл сюди
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    або{' '}
                                    <button
                                        onClick={handleBrowse}
                                        className="text-primary hover:text-primary/80 transition-colors"
                                    >
                                        оберіть файл
                                    </button>
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Підтримуються формати: .xlsx, .xls
                            </p>
                        </div>
                    )}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                />

                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                    >
                        Скасувати
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!selectedFile}
                    >
                        Завантажити
                    </Button>
                </div>
            </div>
        </Modal>
    );
}