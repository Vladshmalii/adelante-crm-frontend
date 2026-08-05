import { Modal } from '@/shared/components/ui/Modal';
import { ProfilePage } from '../components/ProfilePage';
import { UserProfile, ProfileFormData } from '../types';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile;
    onSave: (data: ProfileFormData) => void;
}

export function ProfileModal({ isOpen, onClose, profile, onSave }: ProfileModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <ProfilePage profile={profile} onSave={onSave} />
        </Modal>
    );
}
