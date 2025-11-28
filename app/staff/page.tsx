import { AppShell } from '@/shared/components/layout/AppShell';
import { StaffLayout } from '@/features/staff/components/StaffLayout';

export default function StaffPage() {
    return (
        <AppShell activeSection="staff">
            <StaffLayout />
        </AppShell>
    );
}
