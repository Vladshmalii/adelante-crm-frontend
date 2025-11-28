import { Modal } from '@/shared/components/ui/Modal';
import { PaymentMethodRulesForm } from './PaymentMethodRulesForm';
import { PaymentMethod } from '../../types';

interface PaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<PaymentMethod, 'id'>) => void;
    initialData?: PaymentMethod;
}

export function PaymentMethodModal({ isOpen, onClose, onSave, initialData }: PaymentMethodModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Редагувати метод оплати' : 'Додати метод оплати'}
            size="lg"
        >
            <PaymentMethodRulesForm
                initialData={initialData}
                onSave={onSave}
                onCancel={onClose}
            />
        </Modal>
    );
}