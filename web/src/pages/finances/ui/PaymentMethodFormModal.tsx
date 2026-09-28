import {
  ModalForm,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { App } from 'antd';

import { errorMessage, type Schema } from '@/shared/api';
import { toOptions } from '@/shared/lib';

import { useCreatePaymentMethod, useUpdatePaymentMethod } from '../api/finances.mutations';
import { cashRegistersQueryOptions } from '../api/finances.queries';
import { commissionPayerLabels, commissionTypeLabels, methodTypeLabels } from '../model/labels';

type Method = Schema<'PaymentMethodOut'>;
type FormValues = Schema<'PaymentMethodCreateIn'>;

interface PaymentMethodFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method?: Method;
}

export function PaymentMethodFormModal({
  open,
  onOpenChange,
  method,
}: PaymentMethodFormModalProps) {
  const { message } = App.useApp();
  const create = useCreatePaymentMethod();
  const update = useUpdatePaymentMethod();
  const { data: registers } = useQuery({ ...cashRegistersQueryOptions(), enabled: open });

  return (
    <ModalForm<FormValues>
      title={method ? 'Редагувати метод оплати' : 'Новий метод оплати'}
      open={open}
      onOpenChange={onOpenChange}
      width={640}
      grid
      rowProps={{ gutter: 16 }}
      colProps={{ span: 12 }}
      modalProps={{ destroyOnHidden: true }}
      initialValues={
        method
          ? { ...method, commissionValue: Number(method.commissionValue) }
          : {
              type: 'cash',
              commissionType: 'none',
              commissionValue: 0,
              commissionPayer: 'salon',
              availableOnline: false,
              allowPartialPayment: true,
              allowTips: false,
              sortOrder: 0,
              isActive: true,
            }
      }
      submitter={{ searchConfig: { submitText: 'Зберегти', resetText: 'Скасувати' } }}
      onFinish={async (values) => {
        try {
          const body = { ...values, cashRegisterId: values.cashRegisterId ?? null };
          if (method) await update.mutateAsync({ id: method.id, body });
          else await create.mutateAsync(body);
          message.success(method ? 'Метод оплати оновлено' : 'Метод оплати створено');
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
      <ProFormSelect
        name="type"
        label="Тип"
        allowClear={false}
        options={toOptions(methodTypeLabels)}
      />
      <ProFormSelect
        name="cashRegisterId"
        label="Каса"
        options={(registers ?? []).map((r) => ({ value: r.id, label: r.name }))}
      />
      <ProFormDigit
        name="sortOrder"
        label="Порядок у списку"
        min={0}
        fieldProps={{ precision: 0 }}
      />
      <ProFormSelect
        name="commissionType"
        label="Комісія"
        allowClear={false}
        options={toOptions(commissionTypeLabels)}
      />
      <ProFormDependency name={['commissionType']}>
        {({ commissionType }: { commissionType?: Schema<'CommissionType'> }) =>
          commissionType !== 'none' && (
            <>
              <ProFormDigit
                name="commissionValue"
                label={commissionType === 'percentage' ? 'Розмір, %' : 'Розмір, ₴'}
                min={0}
                fieldProps={{ precision: 2 }}
              />
              <ProFormSelect
                name="commissionPayer"
                label="Хто сплачує комісію"
                allowClear={false}
                options={toOptions(commissionPayerLabels)}
              />
            </>
          )
        }
      </ProFormDependency>
      <ProFormSwitch name="availableOnline" label="Доступний при онлайн-записі" />
      <ProFormSwitch name="allowPartialPayment" label="Часткова оплата" />
      <ProFormSwitch name="allowTips" label="Чайові" />
      <ProFormSwitch name="isActive" label="Активний" />
    </ModalForm>
  );
}
