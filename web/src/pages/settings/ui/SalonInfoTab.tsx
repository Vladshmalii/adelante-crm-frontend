import {
  ProCard,
  ProForm,
  ProFormDatePicker,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { App, Spin } from 'antd';
import dayjs from 'dayjs';

import { errorMessage } from '@/shared/api';
import { isValidPhone } from '@/shared/lib';
import { PhoneInput, QueryErrorAlert } from '@/shared/ui';

import { salonInfoQueryOptions, useUpdateSalonInfo } from '../api/settings.api';
import { changedFields, type SalonFormValues } from '../model/salon';

const optionalPhone = {
  validator: (_: unknown, value?: string) =>
    !value || isValidPhone(value)
      ? Promise.resolve()
      : Promise.reject(new Error('Невірний формат телефону')),
};

/** «Салон»: реквизиты и контакты салона (видны и на сайте записи). */
export function SalonInfoTab() {
  const { message } = App.useApp();
  const { data, error, isPending, refetch } = useQuery(salonInfoQueryOptions());
  const update = useUpdateSalonInfo();

  if (isPending) return <Spin />;
  if (error) return <QueryErrorAlert error={error} onRetry={() => void refetch()} />;

  return (
    <ProCard variant="outlined">
      <ProForm<SalonFormValues>
        // Пересоздаём форму после сохранения — initialValues берутся только при создании.
        key={JSON.stringify(data)}
        layout="vertical"
        grid
        rowProps={{ gutter: 16 }}
        colProps={{ xs: 24, md: 12 }}
        initialValues={{ ...data, openedOn: data.openedOn ? dayjs(data.openedOn) : null }}
        dateFormatter={false}
        submitter={{
          searchConfig: { submitText: 'Зберегти', resetText: 'Скасувати зміни' },
        }}
        onFinish={async (values) => {
          const patch = changedFields(data, values);
          if (Object.keys(patch).length === 0) {
            message.info('Змін немає');
            return true;
          }
          try {
            await update.mutateAsync(patch);
            message.success('Дані салону збережено');
            return true;
          } catch (e) {
            message.error(errorMessage(e));
            return false;
          }
        }}
      >
        <ProFormText
          name="name"
          label="Назва"
          rules={[{ required: true, whitespace: true, message: 'Вкажіть назву салону' }]}
        />
        <ProFormText name="legalName" label="Юридична назва" />
        <ProFormText name="city" label="Місто" />
        <ProFormText name="address" label="Адреса" />
        <ProForm.Item
          name="phone"
          label="Телефон"
          rules={[optionalPhone]}
          colProps={{ xs: 24, md: 12 }}
        >
          <PhoneInput />
        </ProForm.Item>
        <ProFormText
          name="email"
          label="Email"
          rules={[{ type: 'email', message: 'Некоректний email' }]}
        />
        <ProFormText name="website" label="Сайт" placeholder="https://" />
        <ProFormDatePicker
          name="openedOn"
          label="Дата відкриття"
          fieldProps={{ format: 'DD.MM.YYYY', style: { width: '100%' } }}
        />
        <ProFormText name="instagram" label="Instagram" placeholder="@salon або посилання" />
        <ProFormText name="facebook" label="Facebook" />
        <ProFormTextArea
          name="description"
          label="Короткий опис"
          colProps={{ span: 24 }}
          fieldProps={{ maxLength: 2000, showCount: true, rows: 4 }}
        />
      </ProForm>
    </ProCard>
  );
}
