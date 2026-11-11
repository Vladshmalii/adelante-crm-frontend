import {
  CreditCardOutlined,
  GiftOutlined,
  IdcardOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { type LinkProps, useNavigate } from '@tanstack/react-router';
import { Button, Card, Flex, Space, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';

interface Program {
  key: string;
  icon: ReactNode;
  title: string;
  description: string;
  /** Нет — раздел ещё не сделан: кнопка неактивна, тег «Скоро». */
  to?: LinkProps['to'];
}

// Тексты — дословно с экранов заказчика (frontend-loyalty-page.md, раздел 1.1).
const PROGRAMS: Program[] = [
  {
    key: 'cards',
    icon: <CreditCardOutlined />,
    title: 'Карти лояльності, знижки та Кешбек',
    description:
      'Підвищуйте лояльність клієнтів за допомогою повторних знижок, кешбеку та бонусів. Запропонуйте знижку на перший візит або реферальну програму, щоб заохотити клієнтів розповідати про вас.',
    to: '/loyalty/cards',
  },
  {
    key: 'certificates',
    icon: <GiftOutlined />,
    title: 'Сертифікати',
    description:
      'В середньому клієнти використовують тільки 60% проданих сертифікатів, інші 40% так і залишаються невикористаними після придбання. А кожен четвертий проданий сертифікат означає нового клієнта',
    to: '/loyalty/certificates',
  },
  {
    key: 'memberships',
    icon: <IdcardOutlined />,
    title: 'Абонементи',
    description:
      'Членство заохочує повторні відвідування та допомагає оптимізувати час персоналу, підвищуючи рівень заповнюваності.',
  },
  {
    key: 'deposits',
    icon: <WalletOutlined />,
    title: 'Депозити на рахунках клієнтів',
    description:
      'Клієнтські рахунки дозволяють лояльним клієнтам здійснювати передоплату за послуги, забезпечуючи повторні відвідування. Заохочуйте поповнення рахунку, щоб збільшити утримання клієнтів і прибуток.',
    to: '/loyalty/deposits',
  },
];

/** Хаб «Лояльність» (суперюзер): программы лояльности, у каждой — своя страница настроек. */
export function LoyaltyHubPage() {
  const navigate = useNavigate();
  return (
    <PageContainer title="Лояльність">
      <Flex vertical gap={16}>
        {PROGRAMS.map((p) => (
          <Card key={p.key}>
            <Flex gap={20} align="center" wrap>
              <span
                aria-hidden
                style={{ fontSize: 32, color: 'var(--ant-color-primary)', lineHeight: 1 }}
              >
                {p.icon}
              </span>
              <Flex vertical gap={4} style={{ flex: '1 1 320px', minWidth: 0 }}>
                <Space size={8}>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    {p.title}
                  </Typography.Title>
                  {!p.to && <Tag>Скоро</Tag>}
                </Space>
                <Typography.Text type="secondary">{p.description}</Typography.Text>
              </Flex>
              <Button
                disabled={!p.to}
                onClick={() => {
                  if (p.to) void navigate({ to: p.to });
                }}
              >
                Налаштування
              </Button>
            </Flex>
          </Card>
        ))}
      </Flex>
    </PageContainer>
  );
}
