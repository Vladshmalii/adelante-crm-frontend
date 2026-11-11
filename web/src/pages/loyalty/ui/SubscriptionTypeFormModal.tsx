import {
  ModalForm,
  ProFormDigit,
  ProFormGroup,
  ProFormList,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { useQueries, useQuery } from '@tanstack/react-query';
import { App, Button, Form, Popconfirm, Typography } from 'antd';

import { errorMessage, type Schema } from '@/shared/api';
import { meQueryOptions } from '@/shared/auth';
import {
  activationModeLabels,
  balanceModeLabels,
  unitKindLabels,
  useSaveSubscriptionType,
} from '@/widgets/subscriptions';

import { salonServicesQueryOptions } from '../api/loyalty.api';
import {
  NEW_TYPE_VALUES,
  type SubscriptionTypeValues,
  typeFieldErrors,
  typeToValues,
  valuesToBody,
} from '../model/subscription-type';

type SubscriptionType = Schema<'SubscriptionTypeOut'>;

const options = <K extends string>(labels: Record<K, string>) =>
  (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }));

/**
 * Форма типа абонемента (суперюзер, frontend-subscriptions.md, 2.2; подписи — по Altegio):
 * назва, одиниця, баланс (загальний + кількість / роздільний — кількість у кожної послуги),
 * пары салон — послуга, вартість, тривалість (0 — безстроковий), активація, заморозка.
 * `copy` — создание нового типа с полями существующего. Ошибки 422 — у полей.
 */
export function SubscriptionTypeFormModal({
  open,
  type,
  copy = false,
  onClose,
}: {
  open: boolean;
  type?: SubscriptionType;
  copy?: boolean;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<SubscriptionTypeValues>();
  const save = useSaveSubscriptionType();
  const me = useQuery(meQueryOptions);
  const salons = me.data?.salons ?? [];
  const catalogs = useQueries({
    queries: salons.map((s) => ({ ...salonServicesQueryOptions(s.id), enabled: open })),
  });
  const unitKind = Form.useWatch('unitKind', form);
  const balanceMode = Form.useWatch('balanceMode', form);
  const activationMode = Form.useWatch('activationMode', form);
  const freezeAllowed = Form.useWatch('freezeAllowed', form);
  // До первого рендера формы useWatch отдаёт undefined, хотя тип говорит иначе
  const services = Form.useWatch('services', form) as
    (SubscriptionTypeValues['services'][number] | undefined)[] | undefined;
  const unit = unitKind === 'minutes' ? 'хв' : 'відв.';
  const editing = type && !copy ? type : undefined;

  const servicesOf = (salonId: string | undefined) => {
    const index = salons.findIndex((s) => s.id === salonId);
    return index < 0 ? undefined : catalogs[index];
  };

  const archive = async () => {
    if (!editing) return;
    try {
      await save.mutateAsync({ id: editing.id, body: { isActive: !editing.isActive } });
      message.success(editing.isActive ? 'Тип перенесено в архів' : 'Тип повернуто з архіву');
      onClose();
    } catch (e) {
      message.error(errorMessage(e));
    }
  };

  return (
    <ModalForm<SubscriptionTypeValues>
      title={
        editing
          ? `Тип абонемента «${editing.name}»`
          : copy
            ? 'Новий тип абонемента (копія)'
            : 'Новий тип абонемента'
      }
      open={open}
      form={form}
      width={720}
      modalProps={{ destroyOnHidden: true, onCancel: onClose }}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
      initialValues={type ? typeToValues(type, copy) : NEW_TYPE_VALUES}
      submitter={{
        searchConfig: { submitText: 'Зберегти', resetText: 'Скасувати' },
        render: (_, dom) => [
          editing && (
            <Popconfirm
              key="archive"
              title={editing.isActive ? 'Архівувати тип?' : 'Повернути тип з архіву?'}
              description={
                editing.isActive
                  ? 'Тип перестане продаватися. Продані абонементи діють далі.'
                  : 'Тип знову можна буде продати.'
              }
              okText="Так"
              cancelText="Ні"
              onConfirm={archive}
            >
              <Button>{editing.isActive ? 'Архівувати' : 'Повернути з архіву'}</Button>
            </Popconfirm>
          ),
          ...dom,
        ],
      }}
      onFinish={async (v) => {
        const body = valuesToBody(v);
        try {
          await save.mutateAsync(
            editing
              ? { id: editing.id, body }
              : { body: { ...body, isActive: true, sortOrder: type?.sortOrder ?? 0 } },
          );
          message.success('Тип абонемента збережено');
          return true;
        } catch (error) {
          const fields = typeFieldErrors(error);
          if (fields.length) {
            // Пути полей приходят строками бекенда — типизированный NamePath формы их не знает
            form.setFields(
              fields.map((f) => ({ name: f.name, errors: f.errors })) as Parameters<
                typeof form.setFields
              >[0],
            );
          }
          message.error(errorMessage(error));
          return false;
        }
      }}
    >
      <ProFormText
        name="name"
        label="Назва"
        placeholder="Манікюр — 5 відвідувань"
        rules={[{ required: true, whitespace: true, message: 'Вкажіть назву' }]}
      />
      <ProFormGroup>
        <ProFormRadio.Group
          name="unitKind"
          label="Одиниця"
          tooltip="Відвідування — рядок послуги у візиті списує 1. Хвилини — списує тривалість послуги"
          radioType="button"
          options={options(unitKindLabels)}
        />
        <ProFormRadio.Group
          name="balanceMode"
          label="Баланс абонемента"
          tooltip="Загальний — N одиниць на будь-яку послугу зі списку. Роздільний — своя кількість у кожної послуги"
          radioType="button"
          options={options(balanceModeLabels)}
        />
        {balanceMode !== 'separate' && (
          <ProFormDigit
            name="totalUnits"
            label="Кількість"
            width="xs"
            min={1}
            max={100000}
            fieldProps={{ precision: 0, suffix: unit }}
            rules={[{ required: true, message: 'Вкажіть кількість' }]}
          />
        )}
      </ProFormGroup>
      <ProFormList
        name="services"
        label="Послуги"
        min={1}
        creatorButtonProps={{ creatorButtonText: 'Додати послугу' }}
        creatorRecord={{}}
        copyIconProps={false}
        rules={[
          {
            validator: (_, value?: SubscriptionTypeValues['services']) =>
              value?.some((s) => s.salonId && s.serviceId)
                ? Promise.resolve()
                : Promise.reject(new Error('Оберіть хоча б одну послугу')),
          },
        ]}
      >
        {(_field, index) => {
          const row = services?.[index];
          const catalog = servicesOf(row?.salonId);
          return (
            <ProFormGroup key="row">
              <ProFormSelect
                name="salonId"
                placeholder="Салон"
                width="sm"
                options={salons.map((s) => ({ value: s.id, label: s.name }))}
                rules={[{ required: true, message: 'Салон' }]}
                fieldProps={{
                  onChange: () => {
                    form.setFieldValue(['services', index, 'serviceId'], undefined);
                  },
                }}
              />
              <ProFormSelect
                name="serviceId"
                placeholder="Послуга"
                width="md"
                showSearch
                disabled={!row?.salonId}
                fieldProps={{ loading: catalog?.isPending, optionFilterProp: 'label' }}
                options={(catalog?.data ?? []).map((svc) => ({
                  value: svc.id,
                  label: `${svc.name} · ${String(svc.durationMinutes)} хв`,
                }))}
                rules={[{ required: true, message: 'Послуга' }]}
              />
              {balanceMode === 'separate' && (
                <ProFormDigit
                  name="units"
                  placeholder="Кількість"
                  width="xs"
                  min={1}
                  max={100000}
                  fieldProps={{ precision: 0, suffix: unit }}
                  rules={[{ required: true, message: 'Кількість' }]}
                />
              )}
            </ProFormGroup>
          );
        }}
      </ProFormList>
      <ProFormGroup>
        <ProFormDigit
          name="price"
          label="Вартість"
          width="sm"
          min={0.01}
          fieldProps={{ precision: 2, suffix: '₴' }}
          rules={[{ required: true, message: 'Вкажіть вартість' }]}
        />
        <ProFormDigit
          name="durationValue"
          label="Тривалість"
          tooltip="0 — безстроковий. Після закінчення терміну залишок згоряє"
          width="xs"
          min={0}
          fieldProps={{ precision: 0 }}
          rules={[{ required: true, message: 'Вкажіть тривалість' }]}
        />
        <ProFormSelect
          name="durationUnit"
          label=" "
          width="xs"
          allowClear={false}
          options={[
            { value: 'day', label: 'день' },
            { value: 'month', label: 'місяць' },
          ]}
        />
      </ProFormGroup>
      <ProFormGroup>
        <ProFormRadio.Group
          name="activationMode"
          label="Активувати"
          tooltip="Термін дії відраховується від активації"
          options={options(activationModeLabels)}
        />
        {activationMode === 'first_visit' && (
          <ProFormDigit
            name="autoActivateDays"
            label="Автоматично активується через"
            tooltip="Необов'язково. Якщо клієнт не прийде, абонемент активується сам через N днів після продажу"
            width="xs"
            min={1}
            max={3650}
            fieldProps={{ precision: 0, suffix: 'дн.' }}
          />
        )}
      </ProFormGroup>
      <ProFormGroup>
        <ProFormSwitch
          name="freezeAllowed"
          label="Дозволити заморожувати"
          tooltip="Заморозити можна один раз за життя абонемента; термін продовжується на дні заморозки"
        />
        {freezeAllowed && (
          <ProFormDigit
            name="freezeMaxDays"
            label="Максимум днів заморозки"
            tooltip="0 — без обмежень. Ліміт сумарний на весь абонемент"
            width="xs"
            min={0}
            max={3650}
            fieldProps={{ precision: 0 }}
          />
        )}
      </ProFormGroup>
      {editing && editing.issuedCount > 0 && (
        <Typography.Text type="secondary">
          Зміни діють на наступні продажі: продані абонементи ({editing.issuedCount}) зберігають
          умови на момент продажу.
        </Typography.Text>
      )}
    </ModalForm>
  );
}
