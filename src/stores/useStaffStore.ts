import { create } from 'zustand';
import { staffApi, StaffMember, StaffFilters, CreateStaffRequest } from '@/lib/api/staff';

interface StaffState {
    staff: StaffMember[];
    selectedStaff: StaffMember | null;
    isLoading: boolean;
    filters: StaffFilters;

    fetchStaff: (filters?: StaffFilters) => Promise<void>;
    fetchStaffById: (id: string) => Promise<void>;
    createStaff: (data: CreateStaffRequest) => Promise<void>;
    updateStaff: (id: string, data: Partial<CreateStaffRequest>) => Promise<void>;
    deleteStaff: (id: string) => Promise<void>;
    updateSchedule: (id: string, schedule: Record<string, { start: string; end: string }>) => Promise<void>;
    setFilters: (filters: StaffFilters) => void;
    selectStaff: (staff: StaffMember | null) => void;
}

export const useStaffStore = create<StaffState>((set, get) => ({
    staff: [],
    selectedStaff: null,
    isLoading: false,
    filters: {},

    fetchStaff: async (filters) => {
        set({ isLoading: true });
        try {
            const response = await staffApi.getAll(filters);
            set({ staff: response.data || [] });
        } catch (error) {
            console.error('Failed to fetch staff:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchStaffById: async (id) => {
        set({ isLoading: true });
        try {
            const staffMember = await staffApi.getById(id);
            set({ selectedStaff: staffMember });
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
            set((state) => ({ staff: [...state.staff, newStaff] }));
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
            const updatedStaff = await staffApi.update(id, data);
            set((state) => ({
                staff: state.staff.map((s) => (s.id === id ? updatedStaff : s)),
                selectedStaff: state.selectedStaff?.id === id ? updatedStaff : state.selectedStaff
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
            await staffApi.delete(id);
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
            await staffApi.updateSchedule(id, schedule);
            // After updating schedule, we might need to refresh the staff member to get the updated schedule
            const updatedMember = await staffApi.getById(id);
            set((state) => ({
                staff: state.staff.map((s) => (s.id === id ? updatedMember : s)),
                selectedStaff: state.selectedStaff?.id === id ? updatedMember : state.selectedStaff
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
