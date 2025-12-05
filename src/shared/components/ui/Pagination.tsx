import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { ButtonGroup } from './ButtonGroup';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage?: number;
    totalItems?: number;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
    itemsPerPageOptions?: number[];
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage = 10,
    totalItems,
    onItemsPerPageChange,
    itemsPerPageOptions = [10, 25, 50, 100],
}: PaginationProps) {
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            pages.push(totalPages);
        }

        return pages;
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems || 0);

    return (
        <div className="flex items-center justify-between gap-4 flex-wrap">
            {totalItems !== undefined && (
                <div className="text-sm text-muted-foreground">
                    Показано {startItem}-{endItem} з {totalItems}
                </div>
            )}

            <ButtonGroup variant="secondary" size="sm">
                <Button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    leftIcon={<ChevronLeft size={16} />}
                >
                    Назад
                </Button>

                {getPageNumbers().map((page, index) =>
                    page === '...' ? (
                        <Button key={`ellipsis-${index}`} disabled>
                            ...
                        </Button>
                    ) : (
                        <Button
                            key={page}
                            onClick={() => onPageChange(page as number)}
                            variant={currentPage === page ? 'primary' : 'secondary'}
                        >
                            {page}
                        </Button>
                    )
                )}

                <Button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    rightIcon={<ChevronRight size={16} />}
                >
                    Далі
                </Button>
            </ButtonGroup>

            {onItemsPerPageChange && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">На сторінці:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
                    >
                        {itemsPerPageOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}
