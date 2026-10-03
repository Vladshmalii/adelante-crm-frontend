import {
  ModalForm,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { App } from 'antd';
import { useMemo } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { productUnitLabels, toOptions } from '@/shared/lib';

import { useCreateProduct, useUpdateProduct } from '../api/inventory.mutations';
import { inventoryCategoriesQueryOptions } from '../api/inventory.queries';

type Product = Schema<'ProductOut'>;
type Unit = Schema<'ProductUnit'>;

interface FormValues {
  name: string;
  sku: string;
  barcode?: string;
  categoryId?: string;
  unit: Unit;
  packageVolume?: number;
  quantity?: number;
  minQuantity?: number;
  costPrice?: number;
  salePrice?: number;
  description?: string;
}

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

/** Decimal из API приходит строкой, поле ввода ждёт число. */
const num = (value: string | null | undefined) =>
  value === null || value === undefined ? undefined : Number(value);

const blank = (value: string | undefined) => (value?.trim() ? value.trim() : null);

/**
 * Создание и редактирование товара. Остаток задаётся только при создании (бекенд оформит его
 * надходженням «Початковий залишок»); дальше он меняется только движениями.
 */
export function ProductFormModal({ open, onOpenChange, product }: ProductFormModalProps) {
  const { message } = App.useApp();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const { data: categories = [] } = useQuery({
    ...inventoryCategoriesQueryOptions(),
    enabled: open,
  });

  const initialValues = useMemo<Partial<FormValues>>(
    () =>
      product
        ? {
            name: product.name,
            sku: product.sku ?? '',
            barcode: product.barcode ?? undefined,
            categoryId: product.category?.id ?? undefined,
            unit: product.unit,
            packageVolume: num(product.packageVolume),
            minQuantity: num(product.minQuantity),
            costPrice: num(product.costPrice),
            salePrice: num(product.salePrice),
            description: product.description ?? undefined,
          }
        : { unit: 'pcs', quantity: 0, minQuantity: 0 },
    [product],
  );

  return (
    <ModalForm<FormValues>
      title={product ? 'Редагувати товар' : 'Новий товар'}
      open={open}
      onOpenChange={onOpenChange}
      width={640}
      grid
      rowProps={{ gutter: 16 }}
      colProps={{ span: 12 }}
      modalProps={{ destroyOnHidden: true }}
      initialValues={initialValues}
      submitter={{ searchConfig: { submitText: 'Зберегти', resetText: 'Скасувати' } }}
      onFinish={async (v) => {
        const common = {
          name: v.name.trim(),
          sku: v.sku.trim(),
          barcode: blank(v.barcode),
          unit: v.unit,
          // Объём упаковки имеет смысл только для фасованных (не штучных) товаров.
          packageVolume: v.unit === 'pcs' ? null : (v.packageVolume ?? null),
          minQuantity: v.minQuantity ?? 0,
          costPrice: v.costPrice ?? null,
          salePrice: v.salePrice ?? null,
          description: blank(v.description),
        };
        try {
          if (product) {
            await update.mutateAsync({
              id: product.id,
              body: { ...common, ...(v.categoryId ? { categoryId: v.categoryId } : {}) },
            });
          } else {
            await create.mutateAsync({
              ...common,
              categoryId: v.categoryId ?? null,
              quantity: v.quantity ?? 0,
            });
          }
          message.success(product ? 'Товар оновлено' : 'Товар створено');
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
        rules={[{ required: true, whitespace: true, message: 'Вкажіть назву' }]}
      />
      <ProFormText
        name="sku"
        label="Артикул (SKU)"
        tooltip="Унікальний; за ним імпорт з Excel знаходить товар"
        rules={[{ required: true, whitespace: true, message: 'Вкажіть артикул' }]}
      />
      <ProFormText
        name="barcode"
        label="Штрихкод"
        tooltip="Унікальний. Знаходиться в пошуку за будь-якою частиною, наприклад за останніми цифрами"
        fieldProps={{ maxLength: 64 }}
      />
      <ProFormSelect
        name="categoryId"
        label="Категорія"
        placeholder="Без категорії"
        allowClear={!product}
        fieldProps={{ showSearch: { optionFilterProp: 'label' } }}
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />
      <ProFormSelect
        name="unit"
        label="Одиниця виміру"
        allowClear={false}
        options={toOptions(productUnitLabels)}
      />
      <ProFormDependency name={['unit']}>
        {({ unit }: { unit?: Unit }) =>
          unit && unit !== 'pcs' ? (
            <ProFormDigit
              name="packageVolume"
              label="Об'єм упаковки"
              tooltip="Скільки одиниць в одній упаковці — щоб показувати залишок упаковками"
              min={0.001}
              fieldProps={{ suffix: productUnitLabels[unit] }}
            />
          ) : null
        }
      </ProFormDependency>
      {!product && (
        <ProFormDependency name={['unit']}>
          {({ unit }: { unit?: Unit }) => (
            <ProFormDigit
              name="quantity"
              label="Початковий залишок"
              min={0}
              fieldProps={{ suffix: unit ? productUnitLabels[unit] : undefined }}
            />
          )}
        </ProFormDependency>
      )}
      <ProFormDependency name={['unit']}>
        {({ unit }: { unit?: Unit }) => (
          <ProFormDigit
            name="minQuantity"
            label="Мінімальний залишок"
            tooltip="Нижче цього — статус «Закінчується»"
            min={0}
            fieldProps={{ suffix: unit ? productUnitLabels[unit] : undefined }}
          />
        )}
      </ProFormDependency>
      <ProFormDigit name="costPrice" label="Собівартість" min={0} fieldProps={{ suffix: '₴' }} />
      <ProFormDigit name="salePrice" label="Ціна продажу" min={0} fieldProps={{ suffix: '₴' }} />
      <ProFormTextArea name="description" label="Опис" colProps={{ span: 24 }} />
    </ModalForm>
  );
}
