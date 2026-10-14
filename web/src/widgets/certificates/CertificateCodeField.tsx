import { useQuery } from '@tanstack/react-query';
import { AutoComplete, Space, Typography } from 'antd';

import { errorMessage } from '@/shared/api';
import { formatMoney, useDebouncedValue } from '@/shared/lib';

import { certificateLookupQueryOptions, clientCertificatesQueryOptions } from './api';
import { certificateValidity, isCompleteCode } from './model';

/** Чек, который оплачивают сертификатом: визит (с бонусными строками) или продажа клиенту. */
export interface CertificateContext {
  recordId?: string;
  bonusRecordServiceIds?: string[];
  clientId?: string;
}

/**
 * Код сертификата в части оплаты (certificates.md, раздел 5): ввод кода или выбор из
 * сертификатов клиента с остатками. Под полем — остаток и сколько можно оплатить в чеке
 * (у «на послуги» — только его услуги) или причина отказа.
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
      clientId: context.clientId ?? null,
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
              {lookup.data.certificate.scope === 'services' &&
                `, на послуги в чеку — до ${formatMoney(lookup.data.maxPayment)}`}
              {' · '}
              {certificateValidity(lookup.data.certificate.expiresAt)}
            </Typography.Text>
          ))
        ))}
    </Space>
  );
}
