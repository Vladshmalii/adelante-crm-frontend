import { ModalForm, ProFormCheckbox, ProFormSelect } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { App } from 'antd';

import { errorMessage } from '@/shared/api';

import { type ExportBlock, useExportInventory } from '../api/inventory.mutations';
import { inventoryCategoriesQueryOptions } from '../api/inventory.queries';

interface FormValues {
  blocks: ExportBlock[];
  categoryId?: string;
}

interface InventoryExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Категория из фильтра страницы — подставляется по умолчанию. */
  categoryId?: string;
}

export function InventoryExportModal({
  open,
  onOpenChange,
  categoryId,
}: InventoryExportModalProps) {
  const { message } = App.useApp();
  const exportInventory = useExportInventory();
  const { data: categories = [] } = useQuery({
    ...inventoryCategoriesQueryOptions(),
    enabled: open,
  });

  return (
    <ModalForm<FormValues>
      title="Експорт складу в Excel"
      width={440}
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{ destroyOnHidden: true }}
      initialValues={{ blocks: ['main', 'stock', 'finance', 'description'], categoryId }}
      submitter={{ searchConfig: { submitText: 'Вивантажити', resetText: 'Скасувати' } }}
      onFinish={async (v) => {
        try {
          await exportInventory.mutateAsync(v);
          return true;
        } catch (error) {
          message.error(errorMessage(error));
          return false;
        }
      }}
    >
      <ProFormCheckbox.Group
        name="blocks"
        label="Що вивантажити"
        layout="vertical"
        options={[
          { value: 'main', label: 'Основна інформація', disabled: true },
          { value: 'stock', label: 'Складські дані' },
          { value: 'finance', label: 'Фінансова інформація' },
          { value: 'description', label: 'Опис' },
        ]}
      />
      <ProFormSelect
        name="categoryId"
        label="Категорія"
        placeholder="Усі категорії"
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />
    </ModalForm>
  );
}
