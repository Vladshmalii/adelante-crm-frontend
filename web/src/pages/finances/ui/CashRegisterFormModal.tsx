import { ModalForm, ProFormSwitch, ProFormText } from '@ant-design/pro-components';
import { App } from 'antd';

import { errorMessage, type Schema } from '@/shared/api';

import { useCreateCashRegister } from '../api/finances.mutations';

interface CashRegisterFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Только создание: редактирования касс бекенд не поддерживает. */
export function CashRegisterFormModal({ open, onOpenChange }: CashRegisterFormModalProps) {
  const { message } = App.useApp();
  const create = useCreateCashRegister();

  return (
    <ModalForm<Schema<'CashRegisterCreateIn'>>
      title="Нова каса"
      width={440}
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{ destroyOnHidden: true }}
      initialValues={{ isActive: true }}
      submitter={{ searchConfig: { submitText: 'Створити', resetText: 'Скасувати' } }}
      onFinish={async (values) => {
        try {
          await create.mutateAsync({
            ...values,
            location: values.location?.trim() ? values.location : null,
          });
          message.success('Касу створено');
          return true;
        } catch (error) {
          message.error(errorMessage(error));
          return false;
        }
      }}
    >
      <ProFormText
        name="name"
        label="Назва"
        rules={[{ required: true, message: 'Вкажіть назву' }]}
      />
      <ProFormText name="location" label="Розташування" />
      <ProFormSwitch name="isActive" label="Активна" />
    </ModalForm>
  );
}
