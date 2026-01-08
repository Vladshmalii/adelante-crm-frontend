import { create } from 'zustand';
import { staffApi, StaffFilters, CreateStaffRequest } from '@/lib/api/staff';
import type { Staff } from '@/features/staff/types';

interface StaffState {
    staff: Staff[];
    selectedStaff: Staff | null;
    isLoading: boolean;
    filters: StaffFilters;
    setStaff: (items: Staff[]) => void;
    setLoading: (flag: boolean) => void;

    fetchStaff: (filters?: StaffFilters) => Promise<void>;
    fetchStaffById: (id: string | number) => Promise<void>;
    createStaff: (data: CreateStaffRequest) => Promise<void>;
    updateStaff: (id: string | number, data: Partial<CreateStaffRequest>) => Promise<void>;
    deleteStaff: (id: string | number) => Promise<void>;
    updateSchedule: (id: string | number, schedule: Record<string, { start: string; end: string }>) => Promise<void>;
    setFilters: (filters: StaffFilters) => void;
    selectStaff: (staff: Staff | null) => void;
}

export const useStaffStore = create<StaffState>((set, get) => ({
    staff: [],
    selectedStaff: null,
    isLoading: false,
    filters: {},
    setStaff: (items) => set({ staff: items }),
    setLoading: (flag) => set({ isLoading: flag }),

    fetchStaff: async (filters) => {
        set({ isLoading: true });
        try {
            const response = await staffApi.getAll(filters);
            set({ staff: (response as unknown as Staff[]) || [] });
        } catch (error) {
            console.error('Failed to fetch staff:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchStaffById: async (id) => {
        set({ isLoading: true });
        try {
            const staffMember = await staffApi.getById(Number(id));
            set({ selectedStaff: staffMember as unknown as Staff });
        } catch (error) {
            console.error(`Failed to fetch staff with id ${id}:`, error);
        } finally {
            set({ isLoading: false });
        }
    },

    createStaff: async (data) => {
        set({ isLoading: true });
        try {
            const newStaff = await staffApi.create(data);
            set((state) => ({ staff: [...state.staff, newStaff as unknown as Staff] }));
        } catch (error) {
            console.error('Failed to create staff:', error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateStaff: async (id, data) => {
        set({ isLoading: true });
        try {
            const updatedStaff = await staffApi.update(Number(id), data);
            set((state) => ({
                staff: state.staff.map((s) => (s.id === id ? (updatedStaff as unknown as Staff) : s)),
                selectedStaff: state.selectedStaff?.id === id ? (updatedStaff as unknown as Staff) : state.selectedStaff
            }));
        } catch (error) {
            console.error(`Failed to update staff with id ${id}:`, error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteStaff: async (id) => {
        set({ isLoading: true });
        try {
            await staffApi.delete(Number(id));
            set((state) => ({
                staff: state.staff.filter((s) => s.id !== id),
                selectedStaff: state.selectedStaff?.id === id ? null : state.selectedStaff
            }));
        } catch (error) {
            console.error(`Failed to delete staff with id ${id}:`, error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateSchedule: async (id, schedule) => {
        set({ isLoading: true });
        try {
            await staffApi.updateSchedule(Number(id), schedule);
            // After updating schedule, we might need to refresh the staff member to get the updated schedule
            const updatedMember = await staffApi.getById(Number(id));
            set((state) => ({
                staff: state.staff.map((s) => (s.id === id ? (updatedMember as unknown as Staff) : s)),
                selectedStaff: state.selectedStaff?.id === id ? (updatedMember as unknown as Staff) : state.selectedStaff
            }));
        } catch (error) {
            console.error(`Failed to update schedule for staff ${id}:`, error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    setFilters: (filters) => set({ filters }),
    selectStaff: (staff) => set({ selectedStaff: staff }),
}));
