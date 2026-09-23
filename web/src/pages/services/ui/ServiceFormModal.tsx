import {
  ModalForm,
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { App, AutoComplete } from 'antd';

import { errorMessage, type Schema } from '@/shared/api';
import { ColorInput } from '@/shared/ui';

import { useCreateService, useUpdateService } from '../api/services.mutations';
import { activeMastersQueryOptions, serviceCategoriesQueryOptions } from '../api/services.queries';
import { categoryOptions, statusLabels } from '../model/labels';

type Service = Schema<'app__api__admin__services__ServiceOut'>;
type FormValues = Schema<'ServiceCreateIn'>;

interface ServiceFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service;
}

export function ServiceFormModal({ open, onOpenChange, service }: ServiceFormModalProps) {
  const { message } = App.useApp();
  const create = useCreateService();
  const update = useUpdateService();
  const { data: categories = [] } = useQuery({ ...serviceCategoriesQueryOptions(), enabled: open });
  const { data: masters = [], isPending: mastersLoading } = useQuery({
    ...activeMastersQueryOptions(),
    enabled: open,
  });

  return (
    <ModalForm<FormValues>
      title={service ? 'Редагувати послугу' : 'Нова послуга'}
      open={open}
      onOpenChange={onOpenChange}
      width={640}
      grid
      rowProps={{ gutter: 16 }}
      colProps={{ span: 12 }}
      modalProps={{ destroyOnHidden: true }}
      initialValues={
        service
          ? { ...service, masterIds: service.masters?.map((m) => m.id) ?? [] }
          : { category: 'other', durationMinutes: 60, status: 'active', masterIds: [] }
      }
      submitter={{ searchConfig: { submitText: 'Зберегти', resetText: 'Скасувати' } }}
      onFinish={async (values) => {
        try {
          const body = {
            ...values,
            description: values.description?.trim() ? values.description : null,
          };
          if (service) await update.mutateAsync({ id: service.id, body });
          else await create.mutateAsync(body);
          message.success(service ? 'Послугу оновлено' : 'Послугу створено');
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
        colProps={{ span: 24 }}
        placeholder="Наприклад: Стрижка жіноча"
        rules={[{ required: true, message: 'Вкажіть назву' }]}
      />
      <ProForm.Item
        name="category"
        label="Категорія"
        tooltip="Оберіть зі списку або введіть нову"
        rules={[{ required: true, message: 'Вкажіть категорію' }]}
      >
        <AutoComplete
          options={categoryOptions(categories.map((c) => c.category))}
          showSearch={{
            filterOption: (input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
          }}
        />
      </ProForm.Item>
      <ProFormSelect
        name="status"
        label="Статус"
        allowClear={false}
        options={Object.entries(statusLabels).map(([value, { text }]) => ({ value, label: text }))}
      />
      <ProFormDigit
        name="durationMinutes"
        label="Тривалість"
        min={5}
        fieldProps={{ step: 5, suffix: 'хв', precision: 0 }}
        rules={[{ required: true, message: 'Вкажіть тривалість' }]}
      />
      <ProFormDigit
        name="price"
        label="Ціна"
        min={0}
        fieldProps={{ suffix: '₴' }}
        rules={[{ required: true, message: 'Вкажіть ціну' }]}
      />
      <ProFormSelect
        name="masterIds"
        label="Майстри, які виконують послугу"
        mode="multiple"
        colProps={{ span: 24 }}
        fieldProps={{ loading: mastersLoading, optionFilterProp: 'label' }}
        options={masters.map((m) => ({
          value: m.id,
          label: [m.lastName, m.firstName].filter(Boolean).join(' '),
        }))}
      />
      <ProFormTextArea name="description" label="Опис" colProps={{ span: 24 }} />
      <ProForm.Item name="color" label="Колір">
        <ColorInput />
      </ProForm.Item>
    </ModalForm>
  );
}
