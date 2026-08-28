import { create } from 'zustand';
import type { StaffFilters } from '@/lib/api/staff';
import type { Staff } from '@/features/staff/types';

interface PaginationMeta {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
}

interface StaffState {
    staff: Staff[];
    selectedStaff: Staff | null;
    isLoading: boolean;
    filters: StaffFilters;
    pagination: PaginationMeta;
    setStaff: (items: Staff[]) => void;
    setPagination: (pagination: PaginationMeta) => void;
    setLoading: (flag: boolean) => void;
    setFilters: (filters: StaffFilters) => void;
    selectStaff: (staff: Staff | null) => void;
}

export const useStaffStore = create<StaffState>((set) => ({
    staff: [],
    selectedStaff: null,
    isLoading: false,
    filters: {},
    pagination: { page: 1, perPage: 25, total: 0, totalPages: 0 },
    setStaff: (items) => set({ staff: items }),
    setPagination: (pagination) => set({ pagination }),
    setLoading: (flag) => set({ isLoading: flag }),
    setFilters: (filters) => set({ filters }),
    selectStaff: (staff) => set({ selectedStaff: staff }),
}));
