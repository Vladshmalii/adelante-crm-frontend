import {
  ModalForm,
  ProFormDatePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { inSalonTz, SALON_TZ, toOptions } from '@/shared/lib';

import { useCreateDocument, useUpdateDocument } from '../api/finances.mutations';
import {
  contentTypeLabels,
  documentStatusLabels,
  documentTypeLabels,
  tagOptions,
} from '../model/labels';

type Document = Schema<'DocumentOut'>;

interface FormValues {
  type: Schema<'DocumentType'>;
  number: string;
  date: Dayjs;
  amount: number;
  contentType: Schema<'DocumentContentType'>;
  counterparty?: string;
  comment?: string;
  status: Schema<'DocumentStatus'>;
}

interface DocumentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Редактирование: номер и тип задаются только при создании. */
  document?: Document;
}

const blankToNull = (v?: string) => (v?.trim() ? v : null);
/** Дата документа — начало дня по Киеву. */
const toApiDay = (d: Dayjs) => dayjs.tz(d.format('YYYY-MM-DD'), SALON_TZ).toISOString();

export function DocumentFormModal({ open, onOpenChange, document }: DocumentFormModalProps) {
  const { message } = App.useApp();
  const create = useCreateDocument();
  const update = useUpdateDocument();
  const isEdit = !!document;

  // Значения по умолчанию (например, «сейчас») фиксируем на момент открытия формы:
  // ProForm не принимает изменение initialValues после инициализации.
  const initialValues = useMemo(
    () =>
      document
        ? {
            ...document,
            amount: Number(document.amount),
            date: dayjs(inSalonTz(document.date).format('YYYY-MM-DD')),
            counterparty: document.counterparty ?? undefined,
            comment: document.comment ?? undefined,
          }
        : {
            type: 'invoice',
            contentType: 'services',
            status: 'draft',
            date: dayjs(inSalonTz(new Date()).format('YYYY-MM-DD')),
          },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- пересчёт только при открытии
    [open, document],
  );

  return (
    <ModalForm<FormValues>
      title={isEdit ? `Документ № ${document.number}` : 'Новий документ'}
      open={open}
      onOpenChange={onOpenChange}
      width={640}
      grid
      rowProps={{ gutter: 16 }}
      colProps={{ span: 12 }}
      // Даты нужны как Dayjs: в API уходят через пояс салона (fromPickerDateTime).
      dateFormatter={false}
      modalProps={{ destroyOnHidden: true }}
      initialValues={initialValues}
      submitter={{ searchConfig: { submitText: 'Зберегти', resetText: 'Скасувати' } }}
      onFinish={async (v) => {
        try {
          const common = {
            date: toApiDay(v.date),
            amount: v.amount,
            contentType: v.contentType,
            counterparty: blankToNull(v.counterparty),
            comment: blankToNull(v.comment),
            status: v.status,
          };
          if (document) await update.mutateAsync({ id: document.id, body: common });
          else await create.mutateAsync({ ...common, type: v.type, number: v.number });
          message.success(isEdit ? 'Документ оновлено' : 'Документ створено');
          return true;
        } catch (error) {
          message.error(errorMessage(error));
          return false;
        }
      }}
    >
      <ProFormSelect
        name="type"
        label="Тип"
        allowClear={false}
        disabled={isEdit}
        options={toOptions(documentTypeLabels)}
      />
      <ProFormText
        name="number"
        label="Номер"
        disabled={isEdit}
        rules={[{ required: true, message: 'Вкажіть номер' }]}
      />
      <ProFormDatePicker
        name="date"
        label="Дата"
        fieldProps={{ format: 'DD.MM.YYYY', style: { width: '100%' } }}
        rules={[{ required: true, message: 'Вкажіть дату' }]}
      />
      <ProFormDigit
        name="amount"
        label="Сума"
        min={0}
        fieldProps={{ suffix: '₴', precision: 2 }}
        rules={[{ required: true, message: 'Вкажіть суму' }]}
      />
      <ProFormSelect
        name="contentType"
        label="Вміст"
        allowClear={false}
        options={toOptions(contentTypeLabels)}
      />
      <ProFormSelect
        name="status"
        label="Статус"
        allowClear={false}
        options={tagOptions(documentStatusLabels)}
      />
      <ProFormText name="counterparty" label="Контрагент" colProps={{ span: 24 }} />
      <ProFormTextArea name="comment" label="Коментар" colProps={{ span: 24 }} />
    </ModalForm>
  );
}
