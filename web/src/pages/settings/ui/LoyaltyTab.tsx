import { DeleteOutlined, EditOutlined, GiftOutlined, PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDigit,
  ProFormList,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { useQueries, useQuery } from '@tanstack/react-query';
import { App, Button, Modal, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { meQueryOptions } from '@/shared/auth';
import { formatMoney } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';
import { levelBasisLabels } from '@/widgets/loyalty';

import {
  bonusRulesQueryOptions,
  cardTypesQueryOptions,
  salonServicesQueryOptions,
  useDeleteBonusRule,
  useSaveBonusRule,
  useSaveCardType,
} from '../api/loyalty.api';

type CardType = Schema<'CardTypeOut'>;
type Rule = Schema<'BonusRuleOut'>;

/**
 * Налаштування → Лояльність (суперюзер): типы карт — салоны, кешбэк, лимит оплаты кешбэком,
 * сгорание, основа уровней и таблица уровней; бонусные правила с услугами по салонам.
 * Изменения применяются к следующим чекам, уже начисленное не пересчитывается.
 */
export function LoyaltyTab() {
  const types = useQuery(cardTypesQueryOptions());
  const [form, setForm] = useState<{ type?: CardType } | null>(null);
  const [rulesFor, setRulesFor] = useState<CardType | null>(null);

  const columns: ProColumns<CardType>[] = [
    {
      title: 'Тип картки',
      key: 'name',
      render: (_, t) => (
        <Space>
          {t.name}
          {!t.isActive && <Tag>вимкнено</Tag>}
        </Space>
      ),
    },
    {
      title: 'Кешбек',
      key: 'cashback',
      render: (_, t) =>
        Number(t.cashbackPercent) > 0
          ? `${Number(t.cashbackPercent)}% · до ${Number(t.cashbackMaxPaymentPercent)}% чека`
          : 'Ні',
    },
    {
      title: 'Згоряння',
      key: 'ttl',
      render: (_, t) => (t.cashbackTtlDays ? `${t.cashbackTtlDays} дн.` : 'Не згоряє'),
    },
    { title: 'Рівні', key: 'basis', render: (_, t) => levelBasisLabels[t.levelBasis] },
    {
      title: 'Знижки за рівнями',
      key: 'levels',
      render: (_, t) =>
        t.levels.length
          ? t.levels
              .map(
                (lv) =>
                  `${t.levelBasis === 'visits' ? `${Number(lv.threshold)} віз.` : formatMoney(lv.threshold)}: ${Number(lv.discountPercent)}% / ${formatMoney(lv.discountFixed)}`,
              )
              .join('; ')
          : '—',
    },
    {
      title: 'Салони',
      key: 'salons',
      render: (_, t) => t.salons.map((s) => <Tag key={s.id}>{s.name}</Tag>),
    },
    {
      title: '',
      key: 'actions',
      width: 96,
      render: (_, t) => (
        <Space>
          <Button
            type="text"
            aria-label="Бонусні послуги"
            icon={<GiftOutlined />}
            onClick={() => {
              setRulesFor(t);
            }}
          />
          <Button
            type="text"
            aria-label="Редагувати"
            icon={<EditOutlined />}
            onClick={() => {
              setForm({ type: t });
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <QueryErrorAlert error={types.error} onRetry={() => void types.refetch()} />
      <ProTable<CardType>
        rowKey="id"
        headerTitle="Типи карт лояльності"
        columns={columns}
        dataSource={types.data}
        loading={types.isFetching}
        search={false}
        pagination={false}
        columnEmptyText="—"
        scroll={{ x: 'max-content' }}
        options={{ reload: () => void types.refetch(), density: true }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setForm({});
            }}
          >
            Новий тип
          </Button>,
        ]}
      />
      <CardTypeFormModal
        open={form !== null}
        type={form?.type}
        onClose={() => {
          setForm(null);
        }}
      />
      {rulesFor && (
        <BonusRulesModal
          type={rulesFor}
          onClose={() => {
            setRulesFor(null);
          }}
        />
      )}
    </>
  );
}

interface CardTypeValues {
  name: string;
  isActive: boolean;
  cashbackPercent: number;
  cashbackOnServices: boolean;
  cashbackOnProducts: boolean;
  cashbackMaxPaymentPercent: number;
  cashbackTtlDays?: number | null;
  levelBasis: Schema<'LevelBasis'>;
  salonIds: string[];
  levels: { threshold: number; discountPercent?: number; discountFixed?: number; name?: string }[];
}

function CardTypeFormModal({
  open,
  type,
  onClose,
}: {
  open: boolean;
  type?: CardType;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const save = useSaveCardType();
  const me = useQuery(meQueryOptions);

  return (
    <ModalForm<CardTypeValues>
      title={type ? `Тип картки «${type.name}»` : 'Новий тип картки'}
      open={open}
      width={760}
      grid
      rowProps={{ gutter: 16 }}
      colProps={{ span: 12 }}
      modalProps={{ destroyOnHidden: true, onCancel: onClose }}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
      initialValues={
        type
          ? {
              ...type,
              cashbackPercent: Number(type.cashbackPercent),
              cashbackMaxPaymentPercent: Number(type.cashbackMaxPaymentPercent),
              salonIds: type.salons.map((s) => s.id ?? ''),
              levels: type.levels.map((lv) => ({
                threshold: Number(lv.threshold),
                discountPercent: Number(lv.discountPercent),
                discountFixed: Number(lv.discountFixed),
                name: lv.name ?? undefined,
              })),
            }
          : {
              isActive: true,
              cashbackPercent: 0,
              cashbackOnServices: true,
              cashbackOnProducts: true,
              cashbackMaxPaymentPercent: 100,
              levelBasis: 'sold_amount',
              salonIds: [],
              levels: [],
            }
      }
      submitter={{ searchConfig: { submitText: 'Зберегти', resetText: 'Скасувати' } }}
      onFinish={async (v) => {
        try {
          await save.mutateAsync({
            id: type?.id,
            body: {
              ...v,
              cashbackTtlDays: v.cashbackTtlDays ?? null,
              levels: v.levels.map((lv) => ({
                threshold: lv.threshold,
                discountPercent: lv.discountPercent ?? 0,
                discountFixed: lv.discountFixed ?? 0,
                name: lv.name ?? null,
              })),
            },
          });
          message.success('Тип картки збережено');
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
        rules={[{ required: true, message: 'Вкажіть назву' }]}
      />
      <ProFormSwitch name="isActive" label="Видавати нові картки" />
      <ProFormSelect
        name="salonIds"
        label="Діє в салонах"
        mode="multiple"
        colProps={{ span: 24 }}
        tooltip="В інших салонах мережі картку видно, але знижки й кешбек не застосовуються"
        options={(me.data?.salons ?? []).map((s) => ({ value: s.id, label: s.name }))}
      />
      <ProFormDigit
        name="cashbackPercent"
        label="Кешбек, %"
        min={0}
        max={100}
        fieldProps={{ precision: 2, suffix: '%' }}
      />
      <ProFormDigit
        name="cashbackMaxPaymentPercent"
        label="Оплата кешбеком — до % чека"
        min={0}
        max={100}
        fieldProps={{ precision: 2, suffix: '%' }}
      />
      <ProFormSwitch name="cashbackOnServices" label="Кешбек на послуги" />
      <ProFormSwitch name="cashbackOnProducts" label="Кешбек на товари" />
      <ProFormDigit
        name="cashbackTtlDays"
        label="Кешбек згоряє через, днів"
        tooltip="Порожньо — не згоряє"
        min={1}
        fieldProps={{ precision: 0 }}
      />
      <ProFormRadio.Group
        name="levelBasis"
        label="Рівні знижок рахуються"
        options={Object.entries(levelBasisLabels).map(([value, label]) => ({ value, label }))}
      />
      <ProFormList
        name="levels"
        label="Рівні знижок"
        colProps={{ span: 24 }}
        creatorButtonProps={{ creatorButtonText: 'Додати рівень' }}
        copyIconProps={false}
      >
        <ProFormDigit
          name="threshold"
          placeholder="Поріг"
          width="xs"
          min={0}
          rules={[{ required: true, message: 'Поріг' }]}
        />
        <ProFormDigit
          name="discountPercent"
          placeholder="% знижки"
          width="xs"
          min={0}
          max={100}
          fieldProps={{ suffix: '%' }}
        />
        <ProFormDigit
          name="discountFixed"
          placeholder="Фікс. ₴"
          width="xs"
          min={0}
          fieldProps={{ suffix: '₴' }}
        />
        <ProFormText name="name" placeholder="Назва (Срібло)" width="sm" />
      </ProFormList>
    </ModalForm>
  );
}

function BonusRulesModal({ type, onClose }: { type: CardType; onClose: () => void }) {
  const { message } = App.useApp();
  const rules = useQuery(bonusRulesQueryOptions(type.id));
  const remove = useDeleteBonusRule(type.id);
  const [form, setForm] = useState<{ rule?: Rule } | null>(null);
  const salonName = (id: string) => type.salons.find((s) => s.id === id)?.name ?? id;

  return (
    <Modal
      title={`Бонусні послуги — «${type.name}»`}
      open
      onCancel={onClose}
      footer={null}
      width={720}
    >
      <Typography.Paragraph type="secondary">
        Кожна N-та послуга з правила безкоштовна. У правилі вибираються однакові послуги кожного
        салону типу картки — у салонів різні каталоги.
      </Typography.Paragraph>
      <QueryErrorAlert error={rules.error} onRetry={() => void rules.refetch()} />
      <Button
        icon={<PlusOutlined />}
        style={{ marginBottom: 12 }}
        disabled={type.salons.length === 0}
        onClick={() => {
          setForm({});
        }}
      >
        Нове правило
      </Button>
      <Table<Rule>
        size="small"
        rowKey="id"
        loading={rules.isFetching}
        dataSource={rules.data}
        pagination={false}
        columns={[
          {
            title: 'Правило',
            key: 'name',
            render: (_, r) => (
              <Space>
                {r.name}
                {!r.isActive && <Tag>вимкнено</Tag>}
              </Space>
            ),
          },
          { title: 'N', dataIndex: 'everyN', width: 48 },
          {
            title: 'Послуги',
            key: 'services',
            render: (_, r) =>
              Object.entries(
                r.services.reduce<Record<string, number>>((acc, s) => {
                  acc[s.salonId] = (acc[s.salonId] ?? 0) + 1;
                  return acc;
                }, {}),
              )
                .map(([salon, count]) => `${salonName(salon)}: ${count}`)
                .join(', '),
          },
          {
            title: '',
            key: 'actions',
            width: 88,
            render: (_, r) => (
              <Space>
                <Button
                  type="text"
                  aria-label="Редагувати"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setForm({ rule: r });
                  }}
                />
                <Popconfirm
                  title="Видалити правило?"
                  description="Правило з накопиченнями не видаляється — його можна вимкнути."
                  okText="Видалити"
                  cancelText="Скасувати"
                  okButtonProps={{ danger: true }}
                  onConfirm={() =>
                    remove.mutateAsync(r.id).then(
                      () => message.success('Правило видалено'),
                      (e: unknown) => message.error(errorMessage(e)),
                    )
                  }
                >
                  <Button type="text" danger aria-label="Видалити" icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <BonusRuleFormModal
        type={type}
        open={form !== null}
        rule={form?.rule}
        onClose={() => {
          setForm(null);
        }}
      />
    </Modal>
  );
}

interface RuleValues {
  name: string;
  everyN: number;
  isActive: boolean;
  /** salonId → выбранные услуги салона */
  services: Record<string, string[] | undefined>;
}

function BonusRuleFormModal({
  type,
  open,
  rule,
  onClose,
}: {
  type: CardType;
  open: boolean;
  rule?: Rule;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const save = useSaveBonusRule(type.id);
  const salons = type.salons.filter((s): s is { id: string; name: string } => !!s.id);
  const catalogs = useQueries({
    queries: salons.map((s) => ({ ...salonServicesQueryOptions(s.id), enabled: open })),
  });

  return (
    <ModalForm<RuleValues>
      title={rule ? `Правило «${rule.name}»` : 'Нове бонусне правило'}
      open={open}
      width={560}
      modalProps={{ destroyOnHidden: true, onCancel: onClose }}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
      initialValues={
        rule
          ? {
              ...rule,
              services: Object.fromEntries(
                salons.map((s) => [
                  s.id,
                  rule.services.filter((x) => x.salonId === s.id).map((x) => x.serviceId),
                ]),
              ),
            }
          : { everyN: 6, isActive: true, services: {} }
      }
      submitter={{ searchConfig: { submitText: 'Зберегти', resetText: 'Скасувати' } }}
      onFinish={async (v) => {
        const services = Object.entries(v.services).flatMap(([salonId, ids]) =>
          (ids ?? []).map((serviceId) => ({ salonId, serviceId })),
        );
        if (!services.length) {
          message.warning('Оберіть хоча б одну послугу');
          return false;
        }
        try {
          await save.mutateAsync({
            id: rule?.id,
            body: { name: v.name, everyN: v.everyN, isActive: v.isActive, services },
          });
          message.success('Правило збережено');
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
        placeholder="Кожна 6-та стрижка безкоштовно"
        rules={[{ required: true, message: 'Вкажіть назву' }]}
      />
      <ProFormDigit
        name="everyN"
        label="Кожна N-та послуга безкоштовна"
        min={2}
        fieldProps={{ precision: 0 }}
        rules={[{ required: true, message: 'Вкажіть N' }]}
      />
      <ProFormSwitch name="isActive" label="Діє" />
      {salons.map((s, i) => (
        <ProFormSelect
          key={s.id}
          name={['services', s.id]}
          label={`Послуги — ${s.name}`}
          mode="multiple"
          showSearch
          fieldProps={{ loading: catalogs[i]?.isPending, optionFilterProp: 'label' }}
          options={(catalogs[i]?.data ?? []).map((svc) => ({ value: svc.id, label: svc.name }))}
        />
      ))}
    </ModalForm>
  );
}
