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
import { packagedVolume, productUnitLabels, toBaseQuantity, toOptions } from '@/shared/lib';

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
  packagePrice?: number;
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

/** Остаток в единице карточки → значение поля в упаковках, до 3 знаков. */
const toPackages = (value: number | undefined, volume: number | null) =>
  value === undefined || !volume ? value : Math.round((value / volume) * 1000) / 1000;

/**
 * Создание и редактирование товара. Остаток задаётся только при создании (бекенд оформит его
 * надходженням «Початковий залишок»); дальше он меняется только движениями. У фасованного товара
 * начальный и минимальный остаток вводятся упаковками, в API уходят в единице карточки. Цены за
 * единицу — за единицу карточки, цена упаковки отдельно. Единица и объём у товара с движениями
 * заблокированы: другой объём — другая карточка (product-sales.md, решения 3 и 6).
 */
export function ProductFormModal({ open, onOpenChange, product }: ProductFormModalProps) {
  const { message } = App.useApp();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const { data: categories = [] } = useQuery({
    ...inventoryCategoriesQueryOptions(),
    enabled: open,
  });

  const locked = product?.hasMovements === true;
  const savedVolume = product ? packagedVolume(product.unit, product.packageVolume) : null;
  const savedMin = toPackages(num(product?.minQuantity), savedVolume);
  const lockedHint = locked
    ? 'Товар уже має рух: одиницю й об’єм змінити не можна — створіть нову картку'
    : undefined;

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
            minQuantity: toPackages(
              num(product.minQuantity),
              packagedVolume(product.unit, product.packageVolume),
            ),
            costPrice: num(product.costPrice),
            salePrice: num(product.salePrice),
            packagePrice: num(product.packagePrice),
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
        const volume = packagedVolume(v.unit, v.packageVolume);
        // Неизменённый минимум не пересчитываем: упаковками он мог быть округлён до 3 знаков
        const minQuantity =
          product && v.minQuantity === savedMin && volume === savedVolume
            ? Number(product.minQuantity)
            : volume
              ? toBaseQuantity(v.minQuantity ?? 0, 0, volume)
              : (v.minQuantity ?? 0);
        const common = {
          name: v.name.trim(),
          sku: v.sku.trim(),
          barcode: blank(v.barcode),
          unit: v.unit,
          // Объём упаковки имеет смысл только для фасованных (не штучных) товаров.
          packageVolume: v.unit === 'pcs' ? null : (v.packageVolume ?? null),
          minQuantity,
          costPrice: v.costPrice ?? null,
          salePrice: v.salePrice ?? null,
          packagePrice: volume ? (v.packagePrice ?? null) : null,
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
              quantity: volume ? toBaseQuantity(v.quantity ?? 0, 0, volume) : (v.quantity ?? 0),
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
        disabled={locked}
        tooltip={lockedHint}
        options={toOptions(productUnitLabels)}
      />
      <ProFormDependency name={['unit']}>
        {({ unit }: { unit?: Unit }) =>
          unit && unit !== 'pcs' ? (
            <ProFormDigit
              name="packageVolume"
              label="Об'єм упаковки"
              tooltip={
                lockedHint ?? 'Скільки одиниць в одній упаковці — для залишку й продажу упаковками'
              }
              min={0.001}
              disabled={locked}
              fieldProps={{ suffix: productUnitLabels[unit], precision: 3 }}
            />
          ) : null
        }
      </ProFormDependency>
      <ProFormDependency name={['unit', 'packageVolume']}>
        {({ unit, packageVolume }: { unit?: Unit; packageVolume?: number }) => {
          const packaged = packagedVolume(unit, packageVolume) !== null;
          const unitLabel = unit ? productUnitLabels[unit] : '';
          const quantitySuffix = packaged ? 'упак.' : unitLabel;
          return (
            <>
              {!product && (
                <ProFormDigit
                  name="quantity"
                  label="Початковий залишок"
                  tooltip={packaged ? 'В упаковках' : undefined}
                  colProps={{ span: 12 }}
                  min={0}
                  fieldProps={{ suffix: quantitySuffix, precision: 3 }}
                />
              )}
              <ProFormDigit
                name="minQuantity"
                label="Мінімальний залишок"
                tooltip={`Нижче цього — статус «Закінчується»${packaged ? '. В упаковках' : ''}`}
                colProps={{ span: 12 }}
                min={0}
                fieldProps={{ suffix: quantitySuffix, precision: 3 }}
              />
              <ProFormDigit
                name="costPrice"
                label={unit ? `Собівартість за ${unitLabel}` : 'Собівартість'}
                colProps={{ span: 12 }}
                min={0}
                fieldProps={{ suffix: '₴', precision: 4 }}
              />
              <ProFormDigit
                name="salePrice"
                label={
                  !unit
                    ? 'Ціна продажу'
                    : unit === 'pcs'
                      ? 'Ціна продажу за шт'
                      : `Ціна на розлив за ${unitLabel}`
                }
                colProps={{ span: 12 }}
                min={0}
                fieldProps={{ suffix: '₴', precision: 4 }}
              />
              {packaged && (
                <ProFormDigit
                  name="packagePrice"
                  label="Ціна упаковки"
                  tooltip="Без цієї ціни товар продається лише на розлив"
                  colProps={{ span: 12 }}
                  min={0}
                  fieldProps={{ suffix: '₴', precision: 2 }}
                />
              )}
            </>
          );
        }}
      </ProFormDependency>
      <ProFormTextArea name="description" label="Опис" colProps={{ span: 24 }} />
    </ModalForm>
  );
}
