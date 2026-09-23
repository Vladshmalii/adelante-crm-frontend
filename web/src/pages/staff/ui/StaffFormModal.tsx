import {
  ModalForm,
  ProForm,
  ProFormDatePicker,
  ProFormDependency,
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { App } from 'antd';

import { errorMessage, type Schema } from '@/shared/api';
import { useViewer } from '@/shared/auth';
import { genderLabels, isValidPhone, roleLabels, toOptions } from '@/shared/lib';
import { ColorInput, PhoneInput } from '@/shared/ui';

import { useCreateStaff, useUpdateStaff } from '../api/staff.mutations';
import { statusSingular } from '../model/labels';

type Staff = Schema<'StaffOut'>;
// Поле роли видно только суперюзеру; когда его нет в форме, значения роли нет и в onFinish.
type FormValues = Omit<Schema<'StaffCreateIn'>, 'role'> & {
  role?: Schema<'Role'>;
  status?: Schema<'StaffStatus'>;
};

interface StaffFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Нет — создание, есть — редактирование (бекенд редактирует только мастеров). */
  staff?: Staff;
}

const phoneRule = (required: boolean) => ({
  validator: (_: unknown, value?: string) =>
    (!required && !value) || (value && isValidPhone(value))
      ? Promise.resolve()
      : Promise.reject(new Error(required ? 'Вкажіть телефон' : 'Невірний формат телефону')),
});

const emptyToNull = (value: unknown) => (value === '' || value === undefined ? null : value);

export function StaffFormModal({ open, onOpenChange, staff }: StaffFormModalProps) {
  const { message } = App.useApp();
  const { can } = useViewer();
  const create = useCreateStaff();
  const update = useUpdateStaff();
  const isEdit = !!staff;

  const submit = async (values: FormValues) => {
    const common = {
      firstName: values.firstName,
      middleName: emptyToNull(values.middleName) as string | null,
      lastName: emptyToNull(values.lastName) as string | null,
      phone: values.phone,
      additionalPhone: emptyToNull(values.additionalPhone) as string | null,
      email: emptyToNull(values.email) as string | null,
      gender: values.gender ?? null,
      birthDate: values.birthDate ?? null,
      position: emptyToNull(values.position) as string | null,
      specializations: values.specializations ?? [],
      hireDate: values.hireDate ?? null,
      color: values.color ?? null,
      // Зарплата и комиссия — финансовые данные, их правит только суперюзер (docs/ACCESS.md).
      ...(can.staff.viewFinance && {
        salary: values.salary ?? null,
        commissionPercent: values.commissionPercent ?? null,
      }),
    };
    if (staff) {
      await update.mutateAsync({
        id: staff.id,
        body: { ...common, status: values.status ?? null },
      });
    } else {
      await create.mutateAsync({
        ...common,
        role: values.role ?? 'master',
        password: values.role === 'administrator' ? values.password : null,
      });
    }
  };

  return (
    <ModalForm<FormValues>
      title={isEdit ? 'Редагувати співробітника' : 'Новий співробітник'}
      open={open}
      onOpenChange={onOpenChange}
      width={720}
      grid
      rowProps={{ gutter: 16 }}
      colProps={{ span: 12 }}
      dateFormatter="string"
      modalProps={{ destroyOnHidden: true }}
      initialValues={staff ?? { role: 'master' }}
      submitter={{ searchConfig: { submitText: 'Зберегти', resetText: 'Скасувати' } }}
      onFinish={async (values) => {
        try {
          await submit(values);
          message.success(isEdit ? 'Співробітника оновлено' : 'Співробітника створено');
          return true;
        } catch (error) {
          message.error(errorMessage(error));
          return false;
        }
      }}
    >
      {!isEdit && can.staff.manageAdmins && (
        <ProFormRadio.Group
          name="role"
          label="Роль"
          radioType="button"
          colProps={{ span: 24 }}
          options={toOptions(roleLabels)}
        />
      )}
      <ProFormText
        name="firstName"
        label="Ім'я"
        rules={[{ required: true, message: "Вкажіть ім'я" }]}
      />
      <ProFormText name="lastName" label="Прізвище" />
      <ProFormText name="middleName" label="По батькові" />
      <ProFormSelect name="gender" label="Стать" options={toOptions(genderLabels)} />
      <ProForm.Item name="phone" label="Телефон" required rules={[phoneRule(true)]}>
        <PhoneInput />
      </ProForm.Item>
      <ProForm.Item name="additionalPhone" label="Додатковий телефон" rules={[phoneRule(false)]}>
        <PhoneInput />
      </ProForm.Item>
      <ProFormDependency name={['role']}>
        {({ role }: { role?: Schema<'Role'> }) => {
          const isAdmin = !isEdit && role === 'administrator';
          return (
            <>
              <ProFormText
                name="email"
                label="Email"
                tooltip={isAdmin ? 'Адміністратор входить у систему за email' : undefined}
                rules={[
                  { type: 'email', message: 'Невірний формат email' },
                  { required: isAdmin, message: 'Email потрібен для входу' },
                ]}
              />
              {isAdmin && (
                <ProFormText.Password
                  name="password"
                  label="Пароль"
                  rules={[
                    { required: true, message: 'Вкажіть пароль' },
                    { min: 8, message: 'Мінімум 8 символів' },
                  ]}
                />
              )}
            </>
          );
        }}
      </ProFormDependency>
      <ProFormDatePicker name="birthDate" label="Дата народження" width="100%" />
      <ProFormDatePicker name="hireDate" label="Дата прийому" width="100%" />
      <ProFormText name="position" label="Посада" placeholder="Наприклад: Перукар-стиліст" />
      <ProFormSelect
        name="specializations"
        label="Спеціалізації"
        mode="tags"
        placeholder="Введіть і натисніть Enter"
      />
      {isEdit && (
        <ProFormSelect
          name="status"
          label="Статус"
          allowClear={false}
          tooltip="Звільнення — окремою дією в списку"
          options={(['active', 'vacation', 'sick'] as const).map((value) => ({
            value,
            label: statusSingular[value],
          }))}
        />
      )}
      <ProForm.Item name="color" label="Колір у календарі">
        <ColorInput />
      </ProForm.Item>
      {can.staff.viewFinance && (
        <>
          <ProFormDigit name="salary" label="Оклад" min={0} fieldProps={{ suffix: '₴' }} />
          <ProFormDigit
            name="commissionPercent"
            label="Комісія"
            min={0}
            max={100}
            fieldProps={{ suffix: '%' }}
          />
        </>
      )}
    </ModalForm>
  );
}
