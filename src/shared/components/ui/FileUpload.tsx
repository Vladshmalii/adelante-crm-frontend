import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, FileIcon, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';
import { Button } from './Button';

interface FileUploadProps {
    accept?: string;
    maxSize?: number;
    multiple?: boolean;
    onFilesChange: (files: File[]) => void;
    label?: string;
    error?: string;
    helperText?: string;
    showPreview?: boolean;
    className?: string;
}

export function FileUpload({
    accept = '*',
    maxSize = 10 * 1024 * 1024,
    multiple = false,
    onFilesChange,
    label,
    error,
    helperText,
    showPreview = true,
    className,
}: FileUploadProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        if (maxSize && file.size > maxSize) {
            return `Файл ${file.name} перевищує максимальний розмір ${formatFileSize(maxSize)}`;
        }

        if (accept !== '*') {
            const acceptedTypes = accept.split(',').map((type) => type.trim());
            const fileExtension = `.${file.name.split('.').pop()}`;
            const mimeType = file.type;

            const isAccepted = acceptedTypes.some(
                (type) =>
                    type === fileExtension ||
                    type === mimeType ||
                    (type.endsWith('/*') && mimeType.startsWith(type.replace('/*', '')))
            );

            if (!isAccepted) {
                return `Файл ${file.name} має неприпустимий тип`;
            }
        }

        return null;
    };

    const handleFiles = (newFiles: FileList | null) => {
        if (!newFiles) return;

        const fileArray = Array.from(newFiles);
        const validFiles: File[] = [];
        const errors: string[] = [];

        fileArray.forEach((file) => {
            const error = validateFile(file);
            if (error) {
                errors.push(error);
            } else {
                validFiles.push(file);
            }
        });

        if (errors.length > 0) {
            setUploadError(errors.join(', '));
            return;
        }

        setUploadError('');
        const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);

        if (showPreview) {
            validFiles.forEach((file) => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        setPreviews((prev) => [...prev, e.target?.result as string]);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    };

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    };

    const removeFile = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        const updatedPreviews = previews.filter((_, i) => i !== index);
        setFiles(updatedFiles);
        setPreviews(updatedPreviews);
        onFilesChange(updatedFiles);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className={clsx('w-full', className)}>
            {label && (
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    {label}
                </label>
            )}

            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={clsx(
                    'border-2 border-dashed rounded-lg p-6 transition-all duration-200',
                    'flex flex-col items-center justify-center gap-3',
                    'cursor-pointer hover:border-primary/50 hover:bg-accent/5',
                    isDragging && 'border-primary bg-primary/5',
                    (error || uploadError) && 'border-destructive'
                )}
                onClick={() => inputRef.current?.click()}
            >
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                        Перетягніть файли сюди або натисніть для вибору
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {accept !== '*' && `Підтримувані формати: ${accept}`}
                        {maxSize && ` • Максимальний розмір: ${formatFileSize(maxSize)}`}
                    </p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleInputChange}
                    className="hidden"
                />
            </div>

            {(error || uploadError) && (
                <p className="mt-1.5 text-sm text-destructive animate-fade-in">
                    {error || uploadError}
                </p>
            )}

            {helperText && !error && !uploadError && (
                <p className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>
            )}

            {files.length > 0 && (
                <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-accent/5 rounded-lg border border-border animate-fade-in"
                        >
                            {showPreview && file.type.startsWith('image/') && previews[index] ? (
                                <img
                                    src={previews[index]}
                                    alt={file.name}
                                    className="h-12 w-12 object-cover rounded"
                                />
                            ) : file.type.startsWith('image/') ? (
                                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                            ) : (
                                <FileIcon className="h-12 w-12 text-muted-foreground" />
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatFileSize(file.size)}
                                </p>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
