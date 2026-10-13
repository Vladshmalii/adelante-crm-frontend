import { DeleteOutlined, InfoCircleOutlined, PlusOutlined, ToolOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormTextArea,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import {
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useRef, useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { useViewer } from '@/shared/auth';
import { formatDate, formatDateTime, formatMoney } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import {
  cardTransactionsQueryOptions,
  cardTypesQueryOptions,
  cardVisitsQueryOptions,
  clientCardsQueryOptions,
  generateCardNumber,
  newOperationKey,
  useAdjustCashback,
  useDeleteCard,
  useIssueCard,
} from './api';
import { TransactionsTable } from './ClientAccountBlock';
import { formatCardNumber, levelBasisLabels } from './model';

type Card = Schema<'LoyaltyCardOut'>;
type CardStatus = Schema<'CardStatus'>;

const STATUS_OPTIONS: { value: CardStatus; label: string }[] = [
  { value: 'active', label: 'Активний' },
  { value: 'deleted', label: 'Видалений' },
];

const percent = (value: string | number) => `${Number(value)}%`;

/**
 * Блок «Лояльність» в карточке клиента (как в старой CRM): селект «Активний / Видалений»,
 * карта с номером, типом и семью плитками, «Видалити», «Детальніше», «Видати карту».
 */
export function LoyaltyCardsBlock({ clientId }: { clientId: string }) {
  const { can } = useViewer();
  const [status, setStatus] = useState<CardStatus>('active');
  const [issueOpen, setIssueOpen] = useState(false);
  const cards = useQuery(clientCardsQueryOptions(clientId, status));

  return (
    <Card
      size="small"
      title="Лояльність"
      extra={
        <Space>
          <Select<CardStatus>
            size="small"
            value={status}
            options={STATUS_OPTIONS}
            onChange={setStatus}
            style={{ width: 130 }}
          />
          {can.loyalty.manage && status === 'active' && cards.data?.length === 0 && (
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setIssueOpen(true);
              }}
            >
              Видати карту
            </Button>
          )}
        </Space>
      }
    >
      <QueryErrorAlert error={cards.error} onRetry={() => void cards.refetch()} />
      {cards.isPending ? (
        <Spin />
      ) : cards.data?.length ? (
        <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
          {cards.data.map((card) => (
            <LoyaltyCardView key={card.id} card={card} />
          ))}
        </Space>
      ) : (
        <Empty
          description={status === 'active' ? 'Карти лояльності немає' : 'Видалених карт немає'}
        />
      )}
      <IssueCardModal
        clientId={clientId}
        open={issueOpen}
        onClose={() => {
          setIssueOpen(false);
        }}
      />
    </Card>
  );
}

/** Семь плиток карты (раздел 7 спецификации). */
export function CardTiles({ card }: { card: Card }) {
  const t = card.cardType;
  const tiles: { title: React.ReactNode; value: React.ReactNode }[] = [
    {
      title: (
        <Space size={4}>
          Кешбек
          <Tooltip
            title={`${percent(t.cashbackPercent)} від оплаченого; оплатити кешбеком можна до ${percent(t.cashbackMaxPaymentPercent)} чека${t.cashbackTtlDays ? `, згоряє через ${t.cashbackTtlDays} дн.` : ''}`}
          >
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      ),
      value: formatMoney(card.cashbackBalance),
    },
    { title: 'Максимальний % знижки', value: percent(card.maxDiscountPercent) },
    { title: 'Максимальна фіксована знижка', value: formatMoney(card.maxDiscountFixed) },
    {
      title: 'Нараховано бонусних послуг',
      value: (
        <span>
          {card.bonusAccrued}{' '}
          <Typography.Text type="secondary" style={{ fontSize: 14 }}>
            доступно: {card.bonusAvailable}
          </Typography.Text>
        </span>
      ),
    },
    { title: 'Продано', value: formatMoney(card.soldTotal) },
    { title: 'Оплачено', value: formatMoney(card.paidTotal) },
    { title: 'Візити', value: card.visitsCount },
  ];
  return (
    <Row gutter={[12, 12]}>
      {tiles.map((tile, i) => (
        <Col key={i} xs={12} md={6}>
          <Statistic title={tile.title} value={0} formatter={() => tile.value} />
        </Col>
      ))}
    </Row>
  );
}

function LoyaltyCardView({ card }: { card: Card }) {
  const { message } = App.useApp();
  const { can } = useViewer();
  const remove = useDeleteCard();
  const [details, setDetails] = useState(false);
  const deleted = card.status === 'deleted';

  return (
    <Card
      size="small"
      type="inner"
      title={
        <Space wrap>
          <Typography.Text strong copyable={{ text: card.number }}>
            {formatCardNumber(card.number)}
          </Typography.Text>
          <Tag>{card.cardType.name}</Tag>
          {card.level?.name && <Tag color="gold">{card.level.name}</Tag>}
          {deleted && <Tag color="red">Видалена {formatDate(card.deletedAt)}</Tag>}
          {!deleted && !card.appliesHere && (
            <Tooltip title="Тип картки не діє в цьому салоні: знижки й кешбек тут не застосовуються">
              <Tag color="orange">Не діє в цьому салоні</Tag>
            </Tooltip>
          )}
        </Space>
      }
      extra={
        <Space>
          <Button
            size="small"
            onClick={() => {
              setDetails(true);
            }}
          >
            Детальніше
          </Button>
          {can.loyalty.manage && !deleted && (
            <Popconfirm
              title="Видалити картку?"
              description={
                Number(card.cashbackBalance) > 0
                  ? `Кешбек ${formatMoney(card.cashbackBalance)} згорить. Нова картка почнеться з нуля.`
                  : 'Нова картка почнеться з нуля — рівень знижки теж.'
              }
              okText="Видалити"
              cancelText="Скасувати"
              okButtonProps={{ danger: true }}
              onConfirm={() =>
                remove.mutateAsync(card.id).then(
                  () => message.success('Картку видалено'),
                  (e: unknown) => message.error(errorMessage(e)),
                )
              }
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                Видалити
              </Button>
            </Popconfirm>
          )}
        </Space>
      }
    >
      <CardTiles card={card} />
      <CardDetailsModal
        card={card}
        open={details}
        onClose={() => {
          setDetails(false);
        }}
      />
    </Card>
  );
}

function CardDetailsModal({
  card,
  open,
  onClose,
}: {
  card: Card;
  open: boolean;
  onClose: () => void;
}) {
  const { can } = useViewer();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const txns = useQuery({ ...cardTransactionsQueryOptions(card.id), enabled: open });
  const visits = useQuery({ ...cardVisitsQueryOptions(card.id), enabled: open });
  const byVisits = card.cardType.levelBasis === 'visits';
  const bonusProgress = card.bonusProgress ?? [];
  const levelValue = (value: string | number) =>
    byVisits ? `${Number(value)} віз.` : formatMoney(value);

  return (
    <Modal
      title={`Картка ${formatCardNumber(card.number)}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={860}
      destroyOnHidden
    >
      <Descriptions
        size="small"
        column={2}
        bordered
        items={[
          { label: 'Тип картки', children: card.cardType.name },
          { label: 'Рівні', children: levelBasisLabels[card.cardType.levelBasis] },
          {
            label: 'Рівень',
            children: card.level
              ? `${card.level.name ?? `від ${levelValue(card.level.threshold)}`} · ${percent(card.level.discountPercent)} / ${formatMoney(card.level.discountFixed)}`
              : '—',
          },
          {
            label: 'До наступного',
            children: card.nextLevel
              ? `${levelValue(card.nextLevel.remaining)} до «${card.nextLevel.name ?? levelValue(card.nextLevel.threshold)}»`
              : 'Максимальний рівень',
          },
          {
            label: 'Видано',
            children: `${formatDateTime(card.issuedAt)} · ${card.issuedBy.name ?? '—'}`,
          },
          { label: 'Салон видачі', children: card.issuedSalon?.name ?? '—' },
        ]}
        style={{ marginBottom: 16 }}
      />
      {bonusProgress.length > 0 && (
        <Card size="small" title="Бонусні послуги" style={{ marginBottom: 16 }}>
          {bonusProgress.map((p) => (
            <div key={p.ruleId} style={{ marginBottom: 8 }}>
              <Space wrap>
                <Typography.Text>{p.name}</Typography.Text>
                {!p.isActive && <Tag>вимкнено</Tag>}
                <Typography.Text type="secondary">
                  доступно {p.available} · нараховано {p.accruedTotal} · використано {p.usedTotal}
                </Typography.Text>
              </Space>
              <Progress
                percent={Math.max(0, Math.round((p.progress / (p.everyN - 1)) * 100))}
                format={() => `${p.progress} / ${p.everyN - 1}`}
                size="small"
              />
            </div>
          ))}
        </Card>
      )}
      <Tabs
        items={[
          {
            key: 'cashback',
            label: 'Операції кешбеку',
            children: (
              <>
                {can.loyalty.adjust && (
                  <Button
                    size="small"
                    icon={<ToolOutlined />}
                    style={{ marginBottom: 8 }}
                    onClick={() => {
                      setAdjustOpen(true);
                    }}
                  >
                    Коригування кешбеку
                  </Button>
                )}
                <TransactionsTable data={txns.data} loading={txns.isFetching} />
              </>
            ),
          },
          {
            key: 'visits',
            label: 'Факти візитів',
            children: (
              <Table<Schema<'CardVisitOut'>>
                size="small"
                rowKey="id"
                loading={visits.isFetching}
                dataSource={visits.data}
                pagination={false}
                locale={{ emptyText: <Empty description="Візитів за карткою ще немає" /> }}
                columns={[
                  { title: 'Коли', key: 'at', render: (_, v) => formatDateTime(v.happenedAt) },
                  { title: 'Салон', key: 'salon', render: (_, v) => v.salon.name ?? '—' },
                  {
                    title: 'Що',
                    key: 'kind',
                    render: (_, v) => (v.isVisit ? 'Візит' : 'Продаж'),
                  },
                  {
                    title: 'Продано',
                    key: 'sold',
                    align: 'right',
                    render: (_, v) => formatMoney(v.soldAmount),
                  },
                  {
                    title: 'Знижка',
                    key: 'discount',
                    align: 'right',
                    render: (_, v) => formatMoney(v.discountAmount),
                  },
                  {
                    title: 'Оплачено',
                    key: 'paid',
                    align: 'right',
                    render: (_, v) => formatMoney(v.paidAmount),
                  },
                  {
                    title: '',
                    key: 'reversed',
                    render: (_, v) => v.reversedAt && <Tag color="red">Чек скасовано</Tag>,
                  },
                ]}
              />
            ),
          },
        ]}
      />
      <CashbackAdjustModal
        cardId={card.id}
        open={adjustOpen}
        onClose={() => {
          setAdjustOpen(false);
        }}
      />
    </Modal>
  );
}

function CashbackAdjustModal({
  cardId,
  open,
  onClose,
}: {
  cardId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const adjust = useAdjustCashback(cardId);
  const [key, setKey] = useState(newOperationKey);
  return (
    <ModalForm<{ amount: number; comment: string }>
      title="Коригування кешбеку"
      open={open}
      width={420}
      modalProps={{ destroyOnHidden: true, onCancel: onClose }}
      onOpenChange={(value) => {
        if (value) setKey(newOperationKey());
        else onClose();
      }}
      submitter={{ searchConfig: { submitText: 'Провести', resetText: 'Скасувати' } }}
      onFinish={async (v) => {
        try {
          await adjust.mutateAsync({ key, body: v });
          message.success('Кешбек скориговано');
          return true;
        } catch (error) {
          message.error(errorMessage(error));
          return false;
        }
      }}
    >
      <ProFormDigit
        name="amount"
        label="Сума (+ / −)"
        fieldProps={{ suffix: '₴', precision: 2 }}
        rules={[{ required: true, message: 'Вкажіть суму' }]}
      />
      <ProFormTextArea
        name="comment"
        label="Коментар"
        rules={[{ required: true, message: 'Вкажіть причину' }]}
      />
    </ModalForm>
  );
}

interface IssueValues {
  cardTypeId: string;
  number?: string;
}

function IssueCardModal({
  clientId,
  open,
  onClose,
}: {
  clientId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const issue = useIssueCard(clientId);
  const formRef = useRef<ProFormInstance<IssueValues>>(undefined);
  const [generating, setGenerating] = useState(false);
  const types = useQuery({ ...cardTypesQueryOptions(), enabled: open });

  return (
    <ModalForm<IssueValues>
      title="Видати карту лояльності"
      open={open}
      width={440}
      formRef={formRef}
      modalProps={{ destroyOnHidden: true, onCancel: onClose }}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
      submitter={{ searchConfig: { submitText: 'Видати', resetText: 'Скасувати' } }}
      onFinish={async (v) => {
        try {
          await issue.mutateAsync({
            cardTypeId: v.cardTypeId,
            number: v.number?.trim() ? v.number : null,
          });
          message.success('Картку видано');
          return true;
        } catch (error) {
          message.error(errorMessage(error));
          return false;
        }
      }}
    >
      <ProFormSelect
        name="cardTypeId"
        label="Тип картки"
        rules={[{ required: true, message: 'Оберіть тип' }]}
        options={(types.data ?? [])
          .filter((t) => t.isActive)
          .map((t) => ({ value: t.id, label: t.name }))}
        fieldProps={{ loading: types.isPending }}
      />
      <ProForm.Item
        name="number"
        label="Номер картки"
        tooltip="Порожньо — система згенерує номер"
        rules={[{ pattern: /^\d{16}$/, message: '16 цифр' }]}
      >
        <CardNumberInput
          generating={generating}
          onGenerate={() => {
            setGenerating(true);
            generateCardNumber()
              .then((number) => formRef.current?.setFieldsValue({ number }))
              .catch((e: unknown) => void message.error(errorMessage(e)))
              .finally(() => {
                setGenerating(false);
              });
          }}
        />
      </ProForm.Item>
    </ModalForm>
  );
}

/** Поле номера с кнопкой «Згенерувати»; value/onChange передаёт ProForm.Item. */
function CardNumberInput({
  value,
  onChange,
  generating,
  onGenerate,
}: {
  value?: string;
  onChange?: (value: string) => void;
  generating: boolean;
  onGenerate: () => void;
}) {
  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input
        value={value}
        placeholder="Згенерується автоматично"
        maxLength={16}
        onChange={(e) => onChange?.(e.target.value)}
      />
      <Button loading={generating} onClick={onGenerate}>
        Згенерувати
      </Button>
    </Space.Compact>
  );
}
