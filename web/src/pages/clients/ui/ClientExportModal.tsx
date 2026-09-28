import { ModalForm, ProFormCheckbox } from '@ant-design/pro-components';
import { App } from 'antd';

import { errorMessage } from '@/shared/api';

import { useExportClients } from '../api/clients.mutations';

interface ClientExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientExportModal({ open, onOpenChange }: ClientExportModalProps) {
  const { message } = App.useApp();
  const exportClients = useExportClients();

  return (
    <ModalForm<{ includeVisits: boolean }>
      title="Експорт клієнтів в Excel"
      width={420}
      open={open}
      onOpenChange={onOpenChange}
      initialValues={{ includeVisits: false }}
      submitter={{ searchConfig: { submitText: 'Вивантажити', resetText: 'Скасувати' } }}
      onFinish={async ({ includeVisits }) => {
        try {
          await exportClients.mutateAsync(includeVisits);
          return true;
        } catch (error) {
          message.error(errorMessage(error));
          return false;
        }
      }}
    >
      <ProFormCheckbox name="includeVisits">Разом з історією візитів</ProFormCheckbox>
    </ModalForm>
  );
}
