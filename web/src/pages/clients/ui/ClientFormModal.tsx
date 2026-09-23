import {
  ModalForm,
  ProForm,
  ProFormCheckbox,
  ProFormDatePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App } from 'antd';

import { errorMessage, type Schema } from '@/shared/api';
import { genderLabels, isValidPhone, toOptions } from '@/shared/lib';
import { ColorInput, PhoneInput } from '@/shared/ui';

import { useCreateClient, useUpdateClient } from '../api/clients.mutations';
import { categoryLabels, importanceLabels } from '../model/labels';

type Client = Schema<'ClientOut'>;
type FormValues = Schema<'ClientCreateIn'>;

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Нет — создание, есть — редактирование. */
  client?: Client;
}

const phoneRule = (required: boolean) => ({
  validator: (_: unknown, value?: string) =>
    (!required && !value) || (value && isValidPhone(value))
      ? Promise.resolve()
      : Promise.reject(new Error(required ? 'Вкажіть телефон' : 'Невірний формат телефону')),
});

/** Пустые строки из формы → null, чтобы при редактировании поле можно было очистить. */
const emptyToNull = <T extends object>(values: T) =>
  Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === '' ? null : v])) as T;

export function ClientFormModal({ open, onOpenChange, client }: ClientFormModalProps) {
  const { message } = App.useApp();
  const create = useCreateClient();
  const update = useUpdateClient();

  return (
    <ModalForm<FormValues>
      title={client ? 'Редагувати клієнта' : 'Новий клієнт'}
      open={open}
      onOpenChange={onOpenChange}
      width={720}
      grid
      rowProps={{ gutter: 16 }}
      colProps={{ span: 12 }}
      dateFormatter="string"
      modalProps={{ destroyOnHidden: true }}
      initialValues={
        client ?? {
          category: 'new',
          importance: 'medium',
          discountPercent: 0,
          noOnlineBooking: false,
        }
      }
      submitter={{ searchConfig: { submitText: 'Зберегти', resetText: 'Скасувати' } }}
      onFinish={async (values) => {
        try {
          const body = emptyToNull(values);
          if (client) await update.mutateAsync({ id: client.id, body });
          else await create.mutateAsync(body);
          message.success(client ? 'Клієнта оновлено' : 'Клієнта створено');
          return true;
        } catch (error) {
          message.error(errorMessage(error));
          return false;
        }
      }}
    >
      <ProFormText
        name="firstName"
        label="Ім'я"
        rules={[{ required: true, message: "Вкажіть ім'я" }]}
      />
      <ProFormText name="lastName" label="Прізвище" />
      <ProFormText name="middleName" label="По батькові" />
      <ProFormDatePicker name="birthDate" label="Дата народження" width="100%" />
      <ProForm.Item name="phone" label="Телефон" required rules={[phoneRule(true)]}>
        <PhoneInput />
      </ProForm.Item>
      <ProForm.Item name="additionalPhone" label="Додатковий телефон" rules={[phoneRule(false)]}>
        <PhoneInput />
      </ProForm.Item>
      <ProFormText
        name="email"
        label="Email"
        rules={[{ type: 'email', message: 'Невірний формат email' }]}
      />
      <ProFormSelect name="gender" label="Стать" options={toOptions(genderLabels)} />
      <ProFormSelect
        name="category"
        label="Категорія"
        allowClear={false}
        options={Object.entries(categoryLabels).map(([value, { text }]) => ({
          value,
          label: text,
        }))}
      />
      <ProFormSelect
        name="importance"
        label="Важливість"
        allowClear={false}
        options={toOptions(importanceLabels)}
      />
      <ProFormDigit
        name="discountPercent"
        label="Знижка"
        min={0}
        max={100}
        fieldProps={{ suffix: '%', precision: 0 }}
      />
      <ProFormText name="cardNumber" label="Номер картки" />
      <ProFormText name="source" label="Звідки дізнався" />
      <ProForm.Item name="color" label="Кольорова мітка">
        <ColorInput />
      </ProForm.Item>
      <ProFormTextArea name="notes" label="Нотатки" colProps={{ span: 24 }} />
      <ProFormCheckbox name="noOnlineBooking" colProps={{ span: 24 }}>
        Заборонити записуватись онлайн
      </ProFormCheckbox>
    </ModalForm>
  );
}
