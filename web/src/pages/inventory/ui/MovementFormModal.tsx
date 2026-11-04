import {
  ModalForm,
  ProFormDependency,
  ProFormDigit,
  ProFormRadio,
  ProFormText,
} from '@ant-design/pro-components';
import { App, Typography } from 'antd';

import {
  formatQuantity,
  packageBreakdown,
  packagedVolume,
  productUnitLabels,
  toBaseQuantity,
} from '@/shared/lib';
import { errorMessage, type Schema } from '@/shared/api';

import { useCreateMovement } from '../api/inventory.mutations';
import { movementTypeLabels } from '../model/labels';

type Product = Schema<'ProductOut'>;
/** Продажа проводится только оплатой чека (вручную бекенд ответит 422). */
type ManualMovement = Exclude<Schema<'MovementType'>, 'sale'>;

interface FormValues {
  type: ManualMovement;
  quantity?: number;
  packages?: number;
  rest?: number;
  reason?: string;
}

interface MovementFormModalProps {
  product: Product | undefined;
  onClose: () => void;
}

const QUANTITY_LABELS: Record<ManualMovement, string> = {
  receipt: 'Надійшло',
  write_off: 'Списати',
  adjustment: 'Фактичний залишок',
};

const MANUAL_TYPES: ManualMovement[] = ['receipt', 'write_off', 'adjustment'];

/**
 * Рух товару. Для коригування (інвентаризації) вводится фактический остаток — разницу
 * считает бекенд; списание больше остатка он отклонит (409). Фасованный товар вводится как
 * «упаковки + остаток в единице», в API уходит количество в единице карточки.
 */
export function MovementFormModal({ product, onClose }: MovementFormModalProps) {
  const { message } = App.useApp();
  const create = useCreateMovement();
  const volume = product ? packagedVolume(product.unit, product.packageVolume) : null;
  const unitLabel = product ? productUnitLabels[product.unit] : undefined;
  const packs = product && packageBreakdown(product.quantity, product.unit, product.packageVolume);

  return (
    <ModalForm<FormValues>
      title={product ? `Рух товару: ${product.name}` : 'Рух товару'}
      open={!!product}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      width={480}
      modalProps={{ destroyOnHidden: true }}
      initialValues={{ type: 'receipt' }}
      submitter={{ searchConfig: { submitText: 'Провести', resetText: 'Скасувати' } }}
      onFinish={async (v) => {
        if (!product) return false;
        const quantity = volume
          ? toBaseQuantity(v.packages ?? 0, v.rest ?? 0, volume)
          : (v.quantity ?? 0);
        if (v.type !== 'adjustment' && quantity <= 0) {
          message.warning('Вкажіть кількість');
          return false;
        }
        if (v.type === 'write_off' && quantity > Number(product.quantity)) {
          message.warning(
            `Недостатньо товару: в наявності ${formatQuantity(product.quantity, product.unit)}`,
          );
          return false;
        }
        try {
          await create.mutateAsync({
            productId: product.id,
            body: {
              type: v.type,
              quantity,
              reason: v.reason?.trim() ? v.reason.trim() : null,
            },
          });
          message.success('Рух проведено');
          return true;
        } catch (error) {
          message.error(errorMessage(error));
          return false;
        }
      }}
    >
      {product && (
        <Typography.Paragraph type="secondary">
          Зараз на складі: {formatQuantity(product.quantity, product.unit)}
          {packs ? ` (${packs})` : ''}
        </Typography.Paragraph>
      )}
      <ProFormRadio.Group
        name="type"
        radioType="button"
        options={MANUAL_TYPES.map((value) => ({
          value,
          label: movementTypeLabels[value].text,
        }))}
      />
      <ProFormDependency name={['type']}>
        {({ type }: { type?: ManualMovement }) =>
          volume ? (
            <>
              <ProFormDigit
                name="packages"
                label={`${QUANTITY_LABELS[type ?? 'receipt']}: упаковки`}
                tooltip={`В одній упаковці ${formatQuantity(volume, product?.unit ?? 'pcs')}`}
                min={0}
                fieldProps={{ suffix: 'шт', precision: 0 }}
              />
              <ProFormDigit
                name="rest"
                label={`Плюс окремо, ${unitLabel ?? ''}`}
                min={0}
                fieldProps={{ suffix: unitLabel, precision: 3 }}
              />
            </>
          ) : (
            <ProFormDigit
              name="quantity"
              label={QUANTITY_LABELS[type ?? 'receipt']}
              min={type === 'adjustment' ? 0 : 0.001}
              max={type === 'write_off' && product ? Number(product.quantity) : undefined}
              fieldProps={{ suffix: unitLabel, precision: 3 }}
              rules={[{ required: true, message: 'Вкажіть кількість' }]}
            />
          )
        }
      </ProFormDependency>
      <ProFormText
        name="reason"
        label="Причина"
        placeholder="Наприклад: поставка, бій, інвентаризація"
      />
    </ModalForm>
  );
}
