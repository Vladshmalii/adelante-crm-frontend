import { AppstoreOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDatePicker,
  ProFormDependency,
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { useQueries, useQuery } from '@tanstack/react-query';
import { App, Button, Input, Segmented, Space, Tag, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { meQueryOptions } from '@/shared/auth';
import { formatMoney, fromApiDate, pluralUk, toApiDate } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';
import {
  certificateCategoriesQueryOptions,
  certificateScopeLabels,
  groupTemplatesByCategory,
  scopeHasProducts,
  scopeHasServices,
  templateValidity,
} from '@/widgets/certificates';

import {
  certificateTemplatesQueryOptions,
  useSaveCertificateTemplate,
} from '../api/certificates.api';
import { salonProductsQueryOptions, salonServicesQueryOptions } from '../api/loyalty.api';
import { CertificateCategoriesModal } from './CertificateCategoriesModal';

type Template = Schema<'CertificateTemplateOut'>;
type Scope = Schema<'CertificateScope'>;

/** Строка-заголовок категории; шаблоны — её дочерние строки. */
interface GroupRow {
  id: string;
  name: string;
  children: Template[];
}
type Row = Template | GroupRow;

const isGroup = (row: Row): row is GroupRow => 'children' in row;

type View = 'active' | 'archive';

/**
 * Лояльність → Сертифікати → «Типи сертифікатів» (суперюзер): шаблоны подарочных сертификатов
 * сети — номинал (= цена), область (на все / на услуги / на товары / на услуги и товары, выбор
 * по салонам), срок (бессрочный, N дней от продажи или до даты), категория.
 * Список сгруппирован по категориям (certificates.md, раздел 11), группы сворачиваются.
 * «Архів» — скрытые шаблоны (`isActive = false`); фильтр и поиск по названию — на клиенте,
 * бекенд отдаёт все шаблоны одним списком.
 * Правка шаблона не меняет уже проданные сертификаты: у них снимок на момент продажи.
 */
export function CertificatesTab() {
  const templates = useQuery(certificateTemplatesQueryOptions());
  const categories = useQuery(certificateCategoriesQueryOptions());
  const me = useQuery(meQueryOptions);
  const [form, setForm] = useState<{ template?: Template } | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const salonName = (id: string) => me.data?.salons.find((s) => s.id === id)?.name ?? id;
  const [view, setView] = useState<View>('active');
  const [query, setQuery] = useState('');
  const rows = useMemo<GroupRow[]>(() => {
    const q = query.trim().toLowerCase();
    const visible = (templates.data ?? []).filter(
      (t) => t.isActive === (view === 'active') && (!q || t.name.toLowerCase().includes(q)),
    );
    return groupTemplatesByCategory(visible, categories.data ?? []).map((g) => ({
      id: `category:${g.id ?? 'none'}`,
      name: g.name,
      children: g.items,
    }));
  }, [templates.data, categories.data, view, query]);

  /** «Салон 1: 3 посл., Салон 2: 1 тов.» — что выбрано по салонам. */
  const scopeDetails = (t: Template) => {
    const count = (refs: { salonId: string }[], unit: string) =>
      Object.entries(
        refs.reduce<Record<string, number>>((acc, r) => {
          acc[r.salonId] = (acc[r.salonId] ?? 0) + 1;
          return acc;
        }, {}),
      ).map(([salon, n]) => `${salonName(salon)}: ${String(n)} ${unit}`);
    return [...count(t.services, 'посл.'), ...count(t.products, 'тов.')].join(', ');
  };

  const columns: ProColumns<Row>[] = [
    {
      title: 'Назва',
      key: 'name',
      render: (_, row) =>
        isGroup(row) ? (
          <Space>
            <Typography.Text strong>{row.name}</Typography.Text>
            <Typography.Text type="secondary">
              {row.children.length} {pluralUk(row.children.length, ['тип', 'типи', 'типів'])}
            </Typography.Text>
          </Space>
        ) : (
          <Space orientation="vertical" size={0}>
            <Space>
              {row.name}
              {!row.isActive && <Tag>прихований</Tag>}
            </Space>
            <Typography.Text type="secondary">
              {certificateScopeLabels[row.scope]}
              {row.scope !== 'any' && ` · ${scopeDetails(row)}`}
            </Typography.Text>
          </Space>
        ),
    },
    {
      title: 'Номінал',
      key: 'amount',
      align: 'right',
      render: (_, row) => (isGroup(row) ? null : formatMoney(row.amount)),
    },
    {
      title: 'Термін дії',
      key: 'validity',
      render: (_, row) => (isGroup(row) ? null : templateValidity(row)),
    },
    {
      title: 'Випущено',
      key: 'issuedCount',
      align: 'right',
      tooltip: 'Продано сертифікатів за шаблоном, крім анульованих',
      render: (_, row) => (isGroup(row) ? null : row.issuedCount),
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      render: (_, row) =>
        !isGroup(row) && (
          <Button
            type="text"
            aria-label="Редагувати"
            icon={<EditOutlined />}
            onClick={() => {
              setForm({ template: row });
            }}
          />
        ),
    },
  ];

  return (
    <>
      <QueryErrorAlert error={templates.error} onRetry={() => void templates.refetch()} />
      <QueryErrorAlert error={categories.error} onRetry={() => void categories.refetch()} />
      <ProTable<Row>
        rowKey="id"
        headerTitle="Сертифікати Мережа Adelante"
        tooltip="Сертифікат діє в усіх салонах мережі. Зміни шаблону не впливають на продані сертифікати"
        columns={columns}
        dataSource={rows}
        expandable={{
          expandedRowKeys: rows.filter((r) => !collapsed.has(r.id)).map((r) => r.id),
          onExpand: (expanded, row) => {
            setCollapsed((prev) => {
              const next = new Set(prev);
              if (expanded) next.delete(row.id);
              else next.add(row.id);
              return next;
            });
          },
        }}
        loading={templates.isFetching}
        search={false}
        pagination={false}
        columnEmptyText="—"
        scroll={{ x: 'max-content' }}
        options={{ reload: () => void templates.refetch(), density: true }}
        toolBarRender={() => [
          <Segmented<View>
            key="view"
            value={view}
            onChange={setView}
            options={[
              { value: 'active', label: 'Активні' },
              { value: 'archive', label: 'Архів' },
            ]}
          />,
          <Input.Search
            key="search"
            allowClear
            placeholder="Пошук за назвою"
            style={{ width: 220 }}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
          />,
          <Button
            key="categories"
            icon={<AppstoreOutlined />}
            onClick={() => {
              setCategoriesOpen(true);
            }}
          >
            Категорії
          </Button>,
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setForm({});
            }}
          >
            Новий сертифікат
          </Button>,
        ]}
      />
      <TemplateFormModal
        open={form !== null}
        template={form?.template}
        onClose={() => {
          setForm(null);
        }}
      />
      <CertificateCategoriesModal
        open={categoriesOpen}
        onClose={() => {
          setCategoriesOpen(false);
        }}
      />
    </>
  );
}

type Validity = 'none' | 'days' | 'date';

interface TemplateValues {
  name: string;
  amount: number;
  scope: Scope;
  categoryId?: string | null;
  validity: Validity;
  validDays?: number | null;
  validUntil?: Dayjs | null;
  isActive: boolean;
  sortOrder?: number;
  /** salonId → выбранные услуги салона */
  services: Record<string, string[] | undefined>;
  /** salonId → выбранные товары салона */
  products: Record<string, string[] | undefined>;
}

const scopeOptions = (Object.keys(certificateScopeLabels) as Scope[]).map((value) => ({
  value,
  label: value === 'any' ? 'На все (послуги й товари)' : certificateScopeLabels[value],
}));

/** Пары (салон, id) из выбора по салонам. */
const refsOf = (bySalon: Record<string, string[] | undefined> | undefined) =>
  Object.entries(bySalon ?? {}).flatMap(([salonId, ids]) =>
    (ids ?? []).map((id) => ({ salonId, id })),
  );

/** Выбор по салонам из пар шаблона. */
const groupBySalon = (refs: { salonId: string; id: string }[]) =>
  refs.reduce<Record<string, string[]>>((acc, r) => {
    (acc[r.salonId] ??= []).push(r.id);
    return acc;
  }, {});

function TemplateFormModal({
  open,
  template,
  onClose,
}: {
  open: boolean;
  template?: Template;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const save = useSaveCertificateTemplate();
  const me = useQuery(meQueryOptions);
  const categories = useQuery({ ...certificateCategoriesQueryOptions(), enabled: open });
  const salons = me.data?.salons ?? [];
  const services = useQueries({
    queries: salons.map((s) => ({ ...salonServicesQueryOptions(s.id), enabled: open })),
  });
  const products = useQueries({
    queries: salons.map((s) => ({ ...salonProductsQueryOptions(s.id), enabled: open })),
  });

  return (
    <ModalForm<TemplateValues>
      title={template ? `Сертифікат «${template.name}»` : 'Новий сертифікат'}
      open={open}
      width={640}
      // Дата «до» нужна как Dayjs: в API уходит строкой YYYY-MM-DD (toApiDate).
      dateFormatter={false}
      modalProps={{ destroyOnHidden: true, onCancel: onClose }}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
      initialValues={
        template
          ? {
              name: template.name,
              amount: Number(template.amount),
              scope: template.scope,
              categoryId: template.categoryId,
              validity: template.validUntil ? 'date' : template.validDays ? 'days' : 'none',
              validDays: template.validDays,
              validUntil: fromApiDate(template.validUntil),
              isActive: template.isActive,
              sortOrder: template.sortOrder,
              services: groupBySalon(
                template.services.map((x) => ({ salonId: x.salonId, id: x.serviceId })),
              ),
              products: groupBySalon(
                template.products.map((x) => ({ salonId: x.salonId, id: x.productId })),
              ),
            }
          : {
              scope: 'any',
              validity: 'none',
              isActive: true,
              sortOrder: 0,
              services: {},
              products: {},
            }
      }
      submitter={{ searchConfig: { submitText: 'Зберегти', resetText: 'Скасувати' } }}
      onFinish={async (v) => {
        const serviceRefs = scopeHasServices(v.scope)
          ? refsOf(v.services).map(({ salonId, id }) => ({ salonId, serviceId: id }))
          : [];
        const productRefs = scopeHasProducts(v.scope)
          ? refsOf(v.products).map(({ salonId, id }) => ({ salonId, productId: id }))
          : [];
        if (v.scope === 'services' && !serviceRefs.length) {
          message.warning('Оберіть хоча б одну послугу');
          return false;
        }
        if (v.scope === 'products' && !productRefs.length) {
          message.warning('Оберіть хоча б один товар');
          return false;
        }
        if (v.scope === 'services_products' && !serviceRefs.length && !productRefs.length) {
          message.warning('Оберіть хоча б одну послугу або товар');
          return false;
        }
        try {
          await save.mutateAsync({
            id: template?.id,
            body: {
              name: v.name,
              amount: v.amount,
              scope: v.scope,
              categoryId: v.categoryId ?? null,
              validDays: v.validity === 'days' ? (v.validDays ?? null) : null,
              validUntil: v.validity === 'date' ? toApiDate(v.validUntil) : null,
              isActive: v.isActive,
              sortOrder: v.sortOrder ?? 0,
              services: serviceRefs,
              products: productRefs,
            },
          });
          message.success('Сертифікат збережено');
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
        placeholder="На манікюр з покриттям 150 грн"
        rules={[{ required: true, message: 'Вкажіть назву' }]}
      />
      <ProFormDigit
        name="amount"
        label="Номінал"
        tooltip="Сертифікат купують за номінал: ціна дорівнює сумі на сертифікаті"
        min={0.01}
        fieldProps={{ precision: 2, suffix: '₴' }}
        rules={[{ required: true, message: 'Вкажіть номінал' }]}
      />
      <ProFormSelect
        name="categoryId"
        label="Категорія"
        placeholder="Без категорії"
        allowClear
        fieldProps={{ loading: categories.isPending }}
        options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
      />
      <ProFormRadio.Group
        name="validity"
        label="Термін дії"
        tooltip="Після закінчення терміну залишок згоряє"
        options={[
          { value: 'none', label: 'Безстроковий' },
          { value: 'days', label: 'N днів від продажу' },
          { value: 'date', label: 'До дати' },
        ]}
      />
      <ProFormDependency name={['validity']}>
        {({ validity }: { validity?: Validity }) =>
          validity === 'days' ? (
            <ProFormDigit
              name="validDays"
              label="Днів від продажу"
              min={1}
              fieldProps={{ precision: 0 }}
              rules={[{ required: true, message: 'Вкажіть кількість днів' }]}
            />
          ) : (
            validity === 'date' && (
              <ProFormDatePicker
                name="validUntil"
                label="Діє до (включно)"
                tooltip="Після цієї дати шаблон не продається, а продані за ним сертифікати згоряють"
                fieldProps={{ format: 'DD.MM.YYYY' }}
                rules={[{ required: true, message: 'Вкажіть дату' }]}
              />
            )
          )
        }
      </ProFormDependency>
      <ProFormRadio.Group name="scope" label="Чим можна оплатити" options={scopeOptions} />
      <ProFormDependency name={['scope']}>
        {({ scope }: { scope?: Scope }) => (
          <>
            {scope &&
              scopeHasServices(scope) &&
              salons.map((s, i) => (
                <ProFormSelect
                  key={`services-${s.id}`}
                  name={['services', s.id]}
                  label={`Послуги — ${s.name}`}
                  mode="multiple"
                  showSearch
                  fieldProps={{ loading: services[i]?.isPending, optionFilterProp: 'label' }}
                  options={(services[i]?.data ?? []).map((svc) => ({
                    value: svc.id,
                    label: svc.name,
                  }))}
                />
              ))}
            {scope &&
              scopeHasProducts(scope) &&
              salons.map((s, i) => (
                <ProFormSelect
                  key={`products-${s.id}`}
                  name={['products', s.id]}
                  label={`Товари — ${s.name}`}
                  mode="multiple"
                  showSearch
                  fieldProps={{ loading: products[i]?.isPending, optionFilterProp: 'label' }}
                  options={(products[i]?.data ?? []).map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                />
              ))}
          </>
        )}
      </ProFormDependency>
      <ProFormSwitch name="isActive" label="Продається" />
      <ProFormDigit
        name="sortOrder"
        label="Порядок у списку"
        min={0}
        fieldProps={{ precision: 0 }}
      />
    </ModalForm>
  );
}
