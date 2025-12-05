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
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        Результатів на сторінці:
                    </span>
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

                <span className="text-sm text-muted-foreground">
                    Показано результати з {startItem} по {endItem} із {totalItems}
                </span>
            </div>

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
        </div>
    );
}
