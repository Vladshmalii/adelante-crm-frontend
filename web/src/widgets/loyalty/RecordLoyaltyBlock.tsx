import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Descriptions, Tag } from 'antd';

import { formatMoney } from '@/shared/lib';

import { accountQueryOptions, clientCardsQueryOptions } from './api';
import { balanceKind, formatCardNumber } from './model';

/**
 * Блок «Лояльність» в карточке записи: номер карты, уровень, кешбэк и предупреждение о долге
 * клиента (FEATURES.md, п. 6 — раньше этого не было).
 */
export function RecordLoyaltyBlock({ clientId }: { clientId: string }) {
  const cards = useQuery(clientCardsQueryOptions(clientId, 'active'));
  const account = useQuery(accountQueryOptions(clientId));
  const card = cards.data?.[0];
  const balance = account.data?.balance ?? 0;

  if (!card && balanceKind(balance) === 'zero') return null;
  return (
    <Card size="small" title="Лояльність">
      {balanceKind(balance) === 'debt' && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 8 }}
          title={`Борг клієнта: ${formatMoney(-Number(balance))}`}
        />
      )}
      <Descriptions
        size="small"
        column={1}
        items={[
          ...(balanceKind(balance) === 'deposit'
            ? [{ label: 'Депозит', children: formatMoney(balance) }]
            : []),
          ...(card
            ? [
                {
                  label: 'Картка',
                  children: (
                    <>
                      {formatCardNumber(card.number)}
                      {!card.appliesHere && (
                        <Tag color="orange" style={{ marginLeft: 8 }}>
                          не діє тут
                        </Tag>
                      )}
                    </>
                  ),
                },
                {
                  label: 'Рівень',
                  children: card.level
                    ? `${card.level.name ?? card.cardType.name} · ${Number(card.maxDiscountPercent)}%`
                    : '—',
                },
                { label: 'Кешбек', children: formatMoney(card.cashbackBalance) },
                ...(card.bonusAvailable > 0
                  ? [{ label: 'Бонусні послуги', children: `доступно ${card.bonusAvailable}` }]
                  : []),
              ]
            : []),
        ]}
      />
    </Card>
  );
}
