'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Trash2, Eye, Calendar, BarChart } from 'lucide-react';

interface StaffActionsMenuProps {
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onSchedule?: () => void;
    onStatistics?: () => void;
}

export function StaffActionsMenu({ onView, onEdit, onDelete, onSchedule, onStatistics }: StaffActionsMenuProps) {
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
                className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                aria-label="Дії"
            >
                <MoreVertical size={18} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50 animate-scale-in">
                    <div className="py-1">
                        <button
                            onClick={() => handleAction(onView)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                            Переглянути
                        </button>
                        <button
                            onClick={() => handleAction(onEdit)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                            Редагувати
                        </button>
                        {onSchedule && (
                            <button
                                onClick={() => handleAction(onSchedule)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                            >
                                <Calendar className="w-4 h-4" />
                                Графік
                            </button>
                        )}
                        {onStatistics && (
                            <button
                                onClick={() => handleAction(onStatistics)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                            >
                                <BarChart className="w-4 h-4" />
                                Статистика
                            </button>
                        )}
                        <div className="border-t border-border my-1" />
                        <button
                            onClick={() => handleAction(onDelete)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Видалити
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
