import { CameraOutlined, CheckCircleFilled, SendOutlined } from '@ant-design/icons';
import { PageContainer, ProCard, ProForm, ProFormText } from '@ant-design/pro-components';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  Alert,
  App,
  Avatar,
  Button,
  Col,
  Descriptions,
  Flex,
  Row,
  Space,
  Tag,
  Typography,
  Upload,
} from 'antd';

import { errorMessage, type Schema } from '@/shared/api';
import { meQueryOptions } from '@/shared/auth';
import {
  formatDate,
  formatMoney,
  formatPhone,
  genderLabels,
  isValidPhone,
  roleLabels,
} from '@/shared/lib';
import { useSessionStore } from '@/shared/session';
import { PhoneInput } from '@/shared/ui';

import { uploadFile, useUpdateMe } from '../api/profile.mutations';

type Contacts = Schema<'MePatchIn'>;

const TELEGRAM_BOT = 'https://t.me/AdelanteCrmBot';

const STATUS_LABELS: Record<Schema<'StaffStatus'>, string> = {
  active: 'Працює',
  vacation: 'У відпустці',
  sick: 'На лікарняному',
  fired: 'Звільнений',
};

const optionalPhone = {
  validator: (_: unknown, value?: string) =>
    !value || isValidPhone(value)
      ? Promise.resolve()
      : Promise.reject(new Error('Невірний формат телефону')),
};

const emptyToNull = (v?: string | null) => (v?.trim() ? v : null);

export function ProfilePage() {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const { message } = App.useApp();
  const update = useUpdateMe();
  const salonId = useSessionStore((s) => s.salonId);
  const fullName = [me.lastName, me.firstName, me.middleName].filter(Boolean).join(' ');

  return (
    <PageContainer title="Мій профіль">
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={10}>
          <ProCard variant="outlined">
            <Flex gap={16} align="center">
              <Upload
                accept="image/*"
                showUploadList={false}
                customRequest={({ file, onSuccess, onError }) => {
                  uploadFile(file as File)
                    .then((avatarUrl) => update.mutateAsync({ avatarUrl }))
                    .then(() => {
                      onSuccess?.({});
                      void message.success('Фото оновлено');
                    })
                    .catch((e: unknown) => {
                      onError?.(e as Error);
                      void message.error(errorMessage(e));
                    });
                }}
              >
                <Avatar
                  size={88}
                  src={me.avatarUrl ?? undefined}
                  icon={<CameraOutlined />}
                  style={{ cursor: 'pointer' }}
                >
                  {me.avatarUrl ? undefined : me.firstName.charAt(0)}
                </Avatar>
              </Upload>
              <Space orientation="vertical" size={4}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {fullName}
                </Typography.Title>
                <Space wrap>
                  <Tag>{roleLabels[me.role]}</Tag>
                  {me.isSuperuser && <Tag color="gold">Суперюзер</Tag>}
                  {me.salons.map((s) => (
                    <Tag key={s.id} color={s.id === salonId ? 'purple' : undefined}>
                      {s.name}
                    </Tag>
                  ))}
                </Space>
                <Typography.Text type="secondary">Натисніть на фото, щоб змінити</Typography.Text>
              </Space>
            </Flex>
          </ProCard>

          <ProCard title="Особисті дані" variant="outlined" style={{ marginTop: 16 }}>
            <Descriptions
              column={1}
              size="small"
              items={[
                { label: "Ім'я", children: fullName },
                { label: 'Email', children: me.email ?? '—' },
                { label: 'Стать', children: me.gender ? genderLabels[me.gender] : '—' },
                { label: 'Дата народження', children: formatDate(me.birthDate) },
                {
                  label: 'Пароль',
                  children: (
                    <Link to="/forgot-password" search={{ email: me.email ?? undefined }}>
                      Змінити пароль
                    </Link>
                  ),
                },
              ]}
            />
            <Typography.Text type="secondary">
              Ім'я, email і дату народження змінює адміністратор.
            </Typography.Text>
          </ProCard>

          {me.profile && <WorkCard profile={me.profile} />}
        </Col>

        <Col xs={24} xl={14}>
          <ProCard title="Контакти та додаткова інформація" variant="outlined">
            <ProForm<Contacts>
              initialValues={me}
              grid
              rowProps={{ gutter: 16 }}
              colProps={{ span: 12 }}
              submitter={{
                searchConfig: { submitText: 'Зберегти', resetText: 'Скасувати зміни' },
              }}
              onFinish={async (values) => {
                try {
                  await update.mutateAsync({
                    phone: emptyToNull(values.phone),
                    additionalPhone: emptyToNull(values.additionalPhone),
                    address: emptyToNull(values.address),
                    emergencyContactName: emptyToNull(values.emergencyContactName),
                    emergencyContactPhone: emptyToNull(values.emergencyContactPhone),
                  });
                  message.success('Контакти збережено');
                  return true;
                } catch (error) {
                  message.error(errorMessage(error));
                  return false;
                }
              }}
            >
              <ProForm.Item
                name="phone"
                label="Телефон"
                // Первый суперюзер из CLI создаётся без телефона — не блокируем остальные поля.
                // Уже указанный телефон стереть нельзя: по нему привязывается Telegram.
                rules={[{ required: Boolean(me.phone), message: 'Вкажіть телефон' }, optionalPhone]}
              >
                <PhoneInput />
              </ProForm.Item>
              <ProForm.Item
                name="additionalPhone"
                label="Додатковий телефон"
                rules={[optionalPhone]}
              >
                <PhoneInput />
              </ProForm.Item>
              <ProFormText name="address" label="Адреса" colProps={{ span: 24 }} />
              <ProFormText
                name="emergencyContactName"
                label="Контактна особа (екстрений випадок)"
              />
              <ProForm.Item
                name="emergencyContactPhone"
                label="Телефон контактної особи"
                rules={[optionalPhone]}
              >
                <PhoneInput />
              </ProForm.Item>
            </ProForm>
          </ProCard>

          <ProCard title="Telegram" variant="outlined" style={{ marginTop: 16 }}>
            {me.telegramLinked ? (
              <Space>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                Telegram підключено — сповіщення про записи приходять у бот.
              </Space>
            ) : (
              <Alert
                type="info"
                showIcon
                title="Telegram не підключено"
                description={
                  <>
                    Відкрийте бот і натисніть «Поділитися контактом» — прив'язка відбувається за
                    номером телефону{me.phone ? ` ${formatPhone(me.phone)}` : ''}. Номер у Telegram
                    має збігатися з телефоном у профілі.
                  </>
                }
                action={
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    href={TELEGRAM_BOT}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Відкрити бот
                  </Button>
                }
              />
            )}
          </ProCard>
        </Col>
      </Row>
    </PageContainer>
  );
}

function WorkCard({ profile }: { profile: Schema<'SalonProfileOut'> }) {
  return (
    <ProCard title="Робота в салоні" variant="outlined" style={{ marginTop: 16 }}>
      <Descriptions
        column={1}
        size="small"
        items={[
          { label: 'Посада', children: profile.position ?? '—' },
          {
            label: 'Спеціалізації',
            children: profile.specializations.length ? profile.specializations.join(', ') : '—',
          },
          { label: 'Статус', children: STATUS_LABELS[profile.status] },
          { label: 'Дата прийому', children: formatDate(profile.hireDate) },
          { label: 'Оклад', children: formatMoney(profile.salary) },
          {
            label: 'Комісія',
            children: profile.commissionPercent ? `${Number(profile.commissionPercent)}%` : '—',
          },
        ]}
      />
      <Typography.Text type="secondary">
        Посаду, оклад і комісію змінює адміністратор.
      </Typography.Text>
    </ProCard>
  );
}
