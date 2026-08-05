import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ITEMS_PER_PAGE_OPTIONS } from '../constants';
import type { PaginationState } from '../types';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Button } from '@/shared/components/ui/Button';
import { ButtonGroup } from '@/shared/components/ui/ButtonGroup';

interface StaffPaginationProps {
    pagination: PaginationState;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (items: number) => void;
}

export function StaffPagination({
    pagination,
    onPageChange,
    onItemsPerPageChange,
}: StaffPaginationProps) {
    const { currentPage, itemsPerPage, totalItems } = pagination;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className="mt-6 flex flex-col-reverse items-center justify-between gap-4 border-t border-border pb-20 pt-4 md:flex-row md:pb-0">
            <div className="flex w-full flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left md:w-auto md:justify-start">
                <div className="flex items-center gap-2">
                    <span className="hidden text-sm text-muted-foreground sm:inline">
                        Результатів на сторінці:
                    </span>
                    <span className="text-sm text-muted-foreground sm:hidden">На сторінці:</span>
                    <div className="w-[72px]">
                        <Dropdown
                            value={itemsPerPage}
                            onChange={(value) => onItemsPerPageChange(Number(value))}
                            options={ITEMS_PER_PAGE_OPTIONS.map((option) => ({
                                value: option,
                                label: String(option),
                            }))}
                        />
                    </div>
                </div>

                <span className="text-xs text-muted-foreground sm:text-sm">
                    <span className="hidden sm:inline">
                        Показано результати з {startItem} по {endItem} із {totalItems}
                    </span>
                    <span className="sm:hidden">
                        {startItem}-{endItem} із {totalItems}
                    </span>
                </span>
            </div>

            <div className="w-full overflow-x-auto pb-2 md:w-auto md:pb-0">
                <ButtonGroup
                    variant="secondary"
                    size="sm"
                    className="mx-auto flex min-w-max justify-center md:mx-0 md:justify-end"
                >
                    <Button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        leftIcon={<ChevronLeft size={16} />}
                    >
                        <span className="hidden sm:inline">Назад</span>
                    </Button>

                    {getPageNumbers().map((page, index) =>
                        page === '...' ? (
                            <Button key={`ellipsis-${index}`} disabled className="px-2 sm:px-3">
                                ...
                            </Button>
                        ) : (
                            <Button
                                key={page}
                                onClick={() => onPageChange(page as number)}
                                variant={currentPage === page ? 'primary' : 'secondary'}
                                className="px-3 sm:px-4"
                            >
                                {page}
                            </Button>
                        ),
                    )}

                    <Button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        rightIcon={<ChevronRight size={16} />}
                    >
                        <span className="hidden sm:inline">Далі</span>
                    </Button>
                </ButtonGroup>
            </div>
        </div>
    );
}
