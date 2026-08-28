import { ProfilePage } from '@/features/profile/components/ProfilePage';
import { mockUserProfile } from '@/shared/data/mockData';
import type { ProfileFormData } from '@/features/profile/types';

export function ProfileSettings() {
    const handleSave = (data: ProfileFormData) => {
        // TODO: інтеграція з API збереження профілю
        console.log('Зберегти профіль користувача з налаштувань:', data);
    };

    return (
        <div className="max-w-4xl">
            <ProfilePage profile={mockUserProfile} onSave={handleSave} />
        </div>
    );
}
