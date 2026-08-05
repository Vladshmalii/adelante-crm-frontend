'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Trash2, Eye, History } from 'lucide-react';
import clsx from 'clsx';

interface ClientActionsMenuProps {
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onHistory?: () => void;
}

export function ClientActionsMenu({ onView, onEdit, onDelete, onHistory }: ClientActionsMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                aria-label="Дії"
            >
                <MoreVertical size={20} />
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-1 w-48 animate-scale-in rounded-lg border border-border bg-card shadow-lg">
                    <div className="py-1">
                        <button
                            onClick={() => handleAction(onView)}
                            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                        >
                            <Eye className="h-4 w-4" />
                            Переглянути
                        </button>
                        <button
                            onClick={() => handleAction(onEdit)}
                            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                        >
                            <Edit className="h-4 w-4" />
                            Редагувати
                        </button>
                        {onHistory && (
                            <button
                                onClick={() => handleAction(onHistory)}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                            >
                                <History className="h-4 w-4" />
                                Історія
                            </button>
                        )}
                        <div className="my-1 border-t border-border" />
                        <button
                            onClick={() => handleAction(onDelete)}
                            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                        >
                            <Trash2 className="h-4 w-4" />
                            Видалити
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
