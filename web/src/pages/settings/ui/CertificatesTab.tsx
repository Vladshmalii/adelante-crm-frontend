import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
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
import { App, Button, Space, Tag } from 'antd';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { meQueryOptions } from '@/shared/auth';
import { formatMoney } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import {
  certificateTemplatesQueryOptions,
  useSaveCertificateTemplate,
} from '../api/certificates.api';
import { salonServicesQueryOptions } from '../api/loyalty.api';

type Template = Schema<'CertificateTemplateOut'>;
type Scope = Schema<'CertificateScope'>;

const scopeLabels: Record<Scope, string> = {
  any: 'На все (послуги й товари)',
  services: 'На вибрані послуги',
};

/**
 * Налаштування → Сертифікати (суперюзер): шаблоны подарочных сертификатов сети —
 * номинал (= цена), область «на все» / «на послуги» (услуги по салонам), срок.
 * Правка шаблона не меняет уже проданные сертификаты: у них снимок на момент продажи.
 */
export function CertificatesTab() {
  const templates = useQuery(certificateTemplatesQueryOptions());
  const me = useQuery(meQueryOptions);
  const [form, setForm] = useState<{ template?: Template } | null>(null);
  const salonName = (id: string) => me.data?.salons.find((s) => s.id === id)?.name ?? id;

  const columns: ProColumns<Template>[] = [
    {
      title: 'Сертифікат',
      key: 'name',
      render: (_, t) => (
        <Space>
          {t.name}
          {!t.isActive && <Tag>прихований</Tag>}
        </Space>
      ),
    },
    { title: 'Номінал', key: 'amount', render: (_, t) => formatMoney(t.amount) },
    {
      title: 'Діє на',
      key: 'scope',
      render: (_, t) =>
        t.scope === 'any'
          ? 'Все'
          : Object.entries(
              t.services.reduce<Record<string, number>>((acc, s) => {
                acc[s.salonId] = (acc[s.salonId] ?? 0) + 1;
                return acc;
              }, {}),
            )
              .map(([salon, count]) => `${salonName(salon)}: ${count} посл.`)
              .join(', '),
    },
    {
      title: 'Термін',
      key: 'validDays',
      render: (_, t) => (t.validDays ? `${t.validDays} дн. від покупки` : 'Безстроковий'),
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      render: (_, t) => (
        <Button
          type="text"
          aria-label="Редагувати"
          icon={<EditOutlined />}
          onClick={() => {
            setForm({ template: t });
          }}
        />
      ),
    },
  ];

  return (
    <>
      <QueryErrorAlert error={templates.error} onRetry={() => void templates.refetch()} />
      <ProTable<Template>
        rowKey="id"
        headerTitle="Сертифікати Мережа Adelante"
        tooltip="Сертифікат діє в усіх салонах мережі. Зміни шаблону не впливають на продані сертифікати"
        columns={columns}
        dataSource={templates.data}
        loading={templates.isFetching}
        search={false}
        pagination={false}
        columnEmptyText="—"
        scroll={{ x: 'max-content' }}
        options={{ reload: () => void templates.refetch(), density: true }}
        toolBarRender={() => [
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
    </>
  );
}

interface TemplateValues {
  name: string;
  amount: number;
  scope: Scope;
  validDays?: number | null;
  isActive: boolean;
  sortOrder?: number;
  /** salonId → выбранные услуги салона */
  services: Record<string, string[] | undefined>;
}

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
  const salons = me.data?.salons ?? [];
  const catalogs = useQueries({
    queries: salons.map((s) => ({ ...salonServicesQueryOptions(s.id), enabled: open })),
  });

  return (
    <ModalForm<TemplateValues>
      title={template ? `Сертифікат «${template.name}»` : 'Новий сертифікат'}
      open={open}
      width={600}
      modalProps={{ destroyOnHidden: true, onCancel: onClose }}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
      initialValues={
        template
          ? {
              ...template,
              amount: Number(template.amount),
              services: Object.fromEntries(
                salons.map((s) => [
                  s.id,
                  template.services.filter((x) => x.salonId === s.id).map((x) => x.serviceId),
                ]),
              ),
            }
          : { scope: 'any', isActive: true, sortOrder: 0, services: {} }
      }
      submitter={{ searchConfig: { submitText: 'Зберегти', resetText: 'Скасувати' } }}
      onFinish={async (v) => {
        const services =
          v.scope === 'services'
            ? Object.entries(v.services).flatMap(([salonId, ids]) =>
                (ids ?? []).map((serviceId) => ({ salonId, serviceId })),
              )
            : [];
        if (v.scope === 'services' && !services.length) {
          message.warning('Оберіть хоча б одну послугу');
          return false;
        }
        try {
          await save.mutateAsync({
            id: template?.id,
            body: {
              name: v.name,
              amount: v.amount,
              scope: v.scope,
              validDays: v.validDays ?? null,
              isActive: v.isActive,
              sortOrder: v.sortOrder ?? 0,
              services,
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
      <ProFormDigit
        name="validDays"
        label="Діє, днів від покупки"
        tooltip="Порожньо — безстроковий. Після закінчення терміну залишок згоряє"
        min={1}
        fieldProps={{ precision: 0 }}
      />
      <ProFormRadio.Group
        name="scope"
        label="Чим можна оплатити"
        options={Object.entries(scopeLabels).map(([value, label]) => ({ value, label }))}
      />
      <ProFormDependency name={['scope']}>
        {({ scope }: { scope?: Scope }) =>
          scope === 'services' &&
          salons.map((s, i) => (
            <ProFormSelect
              key={s.id}
              name={['services', s.id]}
              label={`Послуги — ${s.name}`}
              mode="multiple"
              showSearch
              fieldProps={{ loading: catalogs[i]?.isPending, optionFilterProp: 'label' }}
              options={(catalogs[i]?.data ?? []).map((svc) => ({ value: svc.id, label: svc.name }))}
            />
          ))
        }
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
