import {
  ModalForm,
  ProForm,
  ProFormDatePicker,
  ProFormDependency,
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { App } from 'antd';

import { errorMessage, type Schema } from '@/shared/api';
import { useViewer } from '@/shared/auth';
import { genderLabels, isValidPhone, roleLabels, toOptions } from '@/shared/lib';
import { ColorInput, PhoneInput } from '@/shared/ui';

import { useCreateStaff, useUpdateStaff } from '../api/staff.mutations';

type Staff = Schema<'StaffOut'>;
// Роль видна только суперюзеру; когда поля нет в форме, нет и значения в onFinish.
type FormValues = Omit<Schema<'StaffCreateIn'>, 'role' | 'isSuperuser'> & {
  role?: Schema<'Role'>;
  isSuperuser?: boolean;
  status?: Schema<'StaffStatus'>;
};

interface StaffFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Нет — создание, есть — редактирование. */
  staff?: Staff;
}

const phoneRule = (required: boolean) => ({
  validator: (_: unknown, value?: string) =>
    (!required && !value) || (value && isValidPhone(value))
      ? Promise.resolve()
      : Promise.reject(new Error(required ? 'Вкажіть телефон' : 'Невірний формат телефону')),
});

const blank = (value?: string | null) => (value?.trim() ? value : null);

export function StaffFormModal({ open, onOpenChange, staff }: StaffFormModalProps) {
  const { message } = App.useApp();
  const { viewer, can } = useViewer();
  const create = useCreateStaff();
  const update = useUpdateStaff();
  const isEdit = !!staff;
  const editingSelf = staff?.id === viewer.id;

  const submit = async (values: FormValues) => {
    const role = staff?.role ?? (can.staff.manageAdmins ? (values.role ?? 'master') : 'master');
    const isAdmin = role === 'administrator';
    const common = {
      firstName: values.firstName,
      middleName: blank(values.middleName),
      lastName: blank(values.lastName),
      phone: values.phone,
      additionalPhone: blank(values.additionalPhone),
      email: blank(values.email),
      gender: values.gender ?? null,
      birthDate: values.birthDate ?? null,
      address: blank(values.address),
      emergencyContactName: blank(values.emergencyContactName),
      emergencyContactPhone: blank(values.emergencyContactPhone),
      position: blank(values.position),
      specializations: values.specializations ?? [],
      hireDate: values.hireDate ?? null,
      color: values.color ?? null,
      // Зарплата и комиссия — финансовые данные, их правит только суперюзер (docs/ACCESS.md).
      ...(can.staff.viewFinance && {
        salary: values.salary ?? null,
        commissionPercent: values.commissionPercent ?? null,
      }),
    };
    // Флаг суперюзера — только суперюзер и только администраторам; себе не меняем.
    const superuserFlag =
      isAdmin && can.staff.manageAdmins && !editingSelf
        ? { isSuperuser: !!values.isSuperuser }
        : {};

    if (staff) {
      await update.mutateAsync({
        id: staff.id,
        body: {
          ...common,
          ...superuserFlag,
          ...(values.password ? { password: values.password } : {}),
        },
      });
    } else {
      await create.mutateAsync({
        ...common,
        role,
        isSuperuser: false,
        ...superuserFlag,
        password: blank(values.password),
      });
    }
  };

  return (
    <ModalForm<FormValues>
      title={isEdit ? 'Редагувати співробітника' : 'Новий співробітник'}
      open={open}
      onOpenChange={onOpenChange}
      width={760}
      grid
      rowProps={{ gutter: 16 }}
      colProps={{ span: 12 }}
      dateFormatter="string"
      modalProps={{ destroyOnHidden: true }}
      initialValues={staff ? { ...staff, password: undefined } : { role: 'master' }}
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
          const isAdmin = (staff?.role ?? role) === 'administrator';
          const newAdmin = !isEdit && isAdmin;
          return (
            <>
              <ProFormText
                name="email"
                label="Email"
                tooltip="Потрібен для входу в систему"
                rules={[
                  { type: 'email', message: 'Невірний формат email' },
                  { required: newAdmin, message: 'Email потрібен для входу' },
                ]}
              />
              <ProFormText.Password
                name="password"
                label={isEdit ? 'Новий пароль' : 'Пароль'}
                placeholder={isEdit ? 'Залиште порожнім, щоб не змінювати' : 'Мінімум 8 символів'}
                tooltip={isEdit ? undefined : 'Без пароля майстер не зможе увійти в систему'}
                fieldProps={{ autoComplete: 'new-password' }}
                rules={[
                  { required: newAdmin, message: 'Вкажіть пароль' },
                  { min: 8, message: 'Мінімум 8 символів' },
                ]}
              />
              {isAdmin && can.staff.manageAdmins && (
                <ProFormSwitch
                  name="isSuperuser"
                  label="Суперюзер"
                  tooltip={
                    editingSelf
                      ? 'Собі зняти прапорець не можна'
                      : 'Доступ до фінансів, вивантажень, зарплат і керування адміністраторами'
                  }
                  disabled={editingSelf}
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
      <ProFormText name="address" label="Адреса" colProps={{ span: 24 }} />
      <ProFormText name="emergencyContactName" label="Контактна особа (екстрений випадок)" />
      <ProForm.Item
        name="emergencyContactPhone"
        label="Телефон контактної особи"
        rules={[phoneRule(false)]}
      >
        <PhoneInput />
      </ProForm.Item>
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
