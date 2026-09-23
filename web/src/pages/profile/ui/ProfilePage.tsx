import { PageContainer } from '@ant-design/pro-components';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Alert, Avatar, Button, Descriptions, Flex, Space, Tag, Typography } from 'antd';

import { meQueryOptions, useViewer } from '@/shared/auth';
import { formatDateTime, formatPhone, roleLabels } from '@/shared/lib';
import { useSessionStore } from '@/shared/session';

export function ProfilePage() {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const { viewer } = useViewer();
  const salonId = useSessionStore((s) => s.salonId);

  return (
    <PageContainer title="Мій профіль">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title="Змінити свої дані тут поки не можна"
        description="Бекенд ще не має методу для редагування власного профілю. Дані майстра змінює адміністратор у розділі «Співробітники»."
      />
      <Flex gap={24} align="flex-start" wrap>
        <Avatar size={96} src={me.avatarUrl ?? undefined}>
          {me.firstName.charAt(0)}
        </Avatar>
        <Descriptions
          style={{ flex: 1, minWidth: 320 }}
          column={1}
          bordered
          size="small"
          items={[
            { label: "Ім'я", children: me.name },
            {
              label: 'Роль',
              children: (
                <Space>
                  {roleLabels[me.role]}
                  {viewer.isSuperuser && <Tag color="gold">Суперюзер</Tag>}
                </Space>
              ),
            },
            {
              label: 'Email',
              children: me.email ? <Typography.Text copyable>{me.email}</Typography.Text> : '—',
            },
            { label: 'Телефон', children: formatPhone(me.phone) || '—' },
            {
              label: 'Салони',
              children: (
                <Space wrap>
                  {me.salons.map((s) => (
                    <Tag key={s.id} color={s.id === salonId ? 'purple' : undefined}>
                      {s.name}
                    </Tag>
                  ))}
                </Space>
              ),
            },
            { label: 'У системі з', children: formatDateTime(me.createdAt) },
            {
              label: 'Пароль',
              children: (
                <Link to="/forgot-password" search={{ email: me.email ?? undefined }}>
                  <Button size="small">Змінити пароль</Button>
                </Link>
              ),
            },
          ]}
        />
      </Flex>
    </PageContainer>
  );
}
