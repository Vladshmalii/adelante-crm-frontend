import { DeleteOutlined, GiftOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, InputNumber, Select, Space, Typography } from 'antd';

import { formatMoney } from '@/shared/lib';

import { certificateTemplatesQueryOptions } from './api';
import { addCertificate, type CertificateSaleItem, MAX_CERTIFICATE_QUANTITY } from './model';

/**
 * «+ Сертифікат» в окне оплаты (certificates.md, раздел 4): шаблоны группой
 * «Сертифікати Мережа Adelante», количество (2 шт. — два кода). Строки-сертификаты не
 * участвуют в скидке и кешбэке, платятся только кассовыми способами — считает сервер.
 */
export function CertificateSalePicker({
  value,
  onChange,
}: {
  value: CertificateSaleItem[];
  onChange: (items: CertificateSaleItem[]) => void;
}) {
  const templates = useQuery(certificateTemplatesQueryOptions());
  const active = (templates.data ?? []).filter((t) => t.isActive);
  const byId = new Map((templates.data ?? []).map((t) => [t.id, t]));
  if (!active.length && !value.length) return null;

  return (
    <Space orientation="vertical" size="small" style={{ display: 'flex', marginBottom: 16 }}>
      {value.map((item) => {
        const template = byId.get(item.templateId);
        return (
          <Space key={item.templateId} wrap>
            <GiftOutlined />
            <Typography.Text>{template?.name ?? 'Сертифікат'}</Typography.Text>
            <Typography.Text type="secondary">
              {template ? formatMoney(template.amount) : ''}
            </Typography.Text>
            <InputNumber
              size="small"
              min={1}
              max={MAX_CERTIFICATE_QUANTITY}
              precision={0}
              value={item.quantity}
              suffix="шт."
              aria-label={`Кількість: ${template?.name ?? 'сертифікат'}`}
              onChange={(quantity) => {
                onChange(value.map((x) => (x === item ? { ...x, quantity: quantity ?? 1 } : x)));
              }}
            />
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              aria-label="Прибрати сертифікат"
              onClick={() => {
                onChange(value.filter((x) => x !== item));
              }}
            />
          </Space>
        );
      })}
      {active.length > 0 && (
        <Select<string>
          value={null}
          placeholder="+ Сертифікат"
          style={{ width: 320 }}
          loading={templates.isPending}
          showSearch={{ optionFilterProp: 'label' }}
          options={[
            {
              label: 'Сертифікати Мережа Adelante',
              options: active.map((t) => ({
                value: t.id,
                label: `${t.name} · ${formatMoney(t.amount)}`,
              })),
            },
          ]}
          onChange={(templateId) => {
            onChange(addCertificate(value, templateId));
          }}
        />
      )}
    </Space>
  );
}
