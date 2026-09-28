import {
  ModalForm,
  ProFormDependency,
  ProFormDigit,
  ProFormRadio,
  ProFormText,
} from '@ant-design/pro-components';
import { App, Typography } from 'antd';

import { formatQuantity, productUnitLabels } from '@/shared/lib';
import { errorMessage, type Schema } from '@/shared/api';

import { useCreateMovement } from '../api/inventory.mutations';
import { movementTypeLabels } from '../model/labels';

type Product = Schema<'ProductOut'>;
type MovementType = Schema<'MovementType'>;

interface FormValues {
  type: MovementType;
  quantity: number;
  reason?: string;
}

interface MovementFormModalProps {
  product: Product | undefined;
  onClose: () => void;
}

const QUANTITY_LABELS: Record<MovementType, string> = {
  receipt: 'Надійшло',
  write_off: 'Списати',
  adjustment: 'Фактичний залишок',
};

/**
 * Рух товару. Для коригування (інвентаризації) вводится фактический остаток — разницу
 * считает бекенд; списание больше остатка он отклонит (409).
 */
export function MovementFormModal({ product, onClose }: MovementFormModalProps) {
  const { message } = App.useApp();
  const create = useCreateMovement();

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
        try {
          await create.mutateAsync({
            productId: product.id,
            body: {
              type: v.type,
              quantity: v.quantity,
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
        </Typography.Paragraph>
      )}
      <ProFormRadio.Group
        name="type"
        radioType="button"
        options={Object.entries(movementTypeLabels).map(([value, { text }]) => ({
          value,
          label: text,
        }))}
      />
      <ProFormDependency name={['type']}>
        {({ type }: { type?: MovementType }) => (
          <ProFormDigit
            name="quantity"
            label={QUANTITY_LABELS[type ?? 'receipt']}
            min={type === 'adjustment' ? 0 : 0.001}
            max={type === 'write_off' && product ? Number(product.quantity) : undefined}
            fieldProps={{ suffix: product ? productUnitLabels[product.unit] : undefined }}
            rules={[{ required: true, message: 'Вкажіть кількість' }]}
          />
        )}
      </ProFormDependency>
      <ProFormText
        name="reason"
        label="Причина"
        placeholder="Наприклад: поставка, бій, інвентаризація"
      />
    </ModalForm>
  );
}
