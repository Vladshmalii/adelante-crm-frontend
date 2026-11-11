import { useQuery } from '@tanstack/react-query';
import { AutoComplete, Space, Typography } from 'antd';

import { errorMessage, type Schema } from '@/shared/api';
import { formatMoney, useDebouncedValue } from '@/shared/lib';

import { certificateLookupQueryOptions, clientCertificatesQueryOptions } from './api';
import { certificateValidity, isCompleteCode } from './model';

const scopeCoverage: Record<Exclude<Schema<'CertificateScope'>, 'any'>, string> = {
  services: 'на послуги',
  products: 'на товари',
  services_products: 'на послуги й товари',
};

/**
 * Чек, который оплачивают сертификатом: визит (с бонусными строками и строками по абонементу)
 * или продажа клиенту; товары чека — для области «на товари» (certificates.md, 13.4, С5).
 */
export interface CertificateContext {
  recordId?: string;
  bonusRecordServiceIds?: string[];
  /** Строки визита, оплаченные абонементом: 0 ₴, сертификат их не покрывает. */
  subscriptionRecordServiceIds?: string[];
  clientId?: string;
  products?: Schema<'ProductSaleIn'>[];
}

/**
 * Код сертификата в части оплаты (certificates.md, раздел 5): ввод кода или выбор из
 * сертификатов клиента с остатками. Под полем — остаток и сколько можно оплатить в чеке
 * (у «на послуги / товари» — только строки из области) или причина отказа.
 */
export function CertificateCodeField({
  value,
  onChange,
  context,
}: {
  value?: string;
  onChange?: (value: string) => void;
  context: CertificateContext;
}) {
  const own = useQuery({
    ...clientCertificatesQueryOptions(context.clientId ?? ''),
    enabled: !!context.clientId,
  });
  const code = useDebouncedValue(value);
  const lookup = useQuery({
    ...certificateLookupQueryOptions({
      code: code ?? '',
      recordId: context.recordId ?? null,
      bonusRecordServiceIds: context.bonusRecordServiceIds ?? [],
      subscriptionRecordServiceIds: context.subscriptionRecordServiceIds ?? [],
      clientId: context.clientId ?? null,
      products: context.products ?? [],
    }),
    enabled: isCompleteCode(code),
  });
  const usable = (own.data ?? []).filter(
    (c) =>
      Number(c.balance) > 0 &&
      (c.status === 'active' || c.status === 'issued') &&
      (!c.owner || c.owner.id === context.clientId),
  );

  return (
    <Space orientation="vertical" size={0}>
      <AutoComplete
        value={value}
        onChange={onChange}
        style={{ width: 240 }}
        placeholder="ADL-XXXXX-XXXXX"
        aria-label="Код сертифіката"
        options={usable.map((c) => ({
          value: c.code,
          label: `${c.code} · ${c.name} · ${formatMoney(c.balance)}`,
        }))}
      />
      {isCompleteCode(value) &&
        (lookup.error ? (
          <Typography.Text type="danger">{errorMessage(lookup.error)}</Typography.Text>
        ) : (
          lookup.data &&
          (lookup.data.error ? (
            <Typography.Text type="danger">{lookup.data.error}</Typography.Text>
          ) : (
            <Typography.Text type="secondary">
              {lookup.data.certificate.name} · залишок{' '}
              {formatMoney(lookup.data.certificate.balance)}
              {lookup.data.certificate.scope !== 'any' &&
                `, ${scopeCoverage[lookup.data.certificate.scope]} в чеку — до ${formatMoney(lookup.data.maxPayment)}`}
              {' · '}
              {certificateValidity(lookup.data.certificate.expiresAt)}
            </Typography.Text>
          ))
        ))}
    </Space>
  );
}
