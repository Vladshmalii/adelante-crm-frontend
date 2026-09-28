import { EditOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Descriptions, Drawer, Result, Space, Spin, Tag, Typography } from 'antd';

import type { Schema } from '@/shared/api';
import { useViewer } from '@/shared/auth';
import { formatDate, formatMoney, formatPhone, genderLabels, roleLabels } from '@/shared/lib';

import { staffMemberQueryOptions } from '../api/staff.queries';
import { staffFullName, statusLabels, statusSingular } from '../model/labels';
import { canManage } from '../model/rules';

type Staff = Schema<'StaffOut'>;

interface StaffDrawerProps {
  staffId: string | undefined;
  onClose: () => void;
  onEdit: (staff: Staff) => void;
}

/** Карточка сотрудника по `GET /staff/{id}` — открывается и по прямой ссылке `?id=`. */
export function StaffDrawer({ staffId, onClose, onEdit }: StaffDrawerProps) {
  const { can } = useViewer();
  const {
    data: staff,
    isPending,
    isError,
    error,
  } = useQuery({
    ...staffMemberQueryOptions(staffId ?? ''),
    enabled: !!staffId,
  });

  return (
    <Drawer
      open={!!staffId}
      onClose={onClose}
      size="large"
      destroyOnHidden
      title={staff ? staffFullName(staff) : 'Співробітник'}
      extra={
        staff &&
        canManage(can, staff) && (
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              onEdit(staff);
            }}
          >
            Редагувати
          </Button>
        )
      }
    >
      {isError ? (
        <Result
          status="error"
          title="Не вдалося завантажити співробітника"
          subTitle={error.message}
        />
      ) : isPending ? (
        <Spin />
      ) : (
        <Descriptions
          column={1}
          bordered
          size="small"
          items={[
            {
              label: 'Роль',
              children: (
                <Space>
                  {roleLabels[staff.role]}
                  {staff.isSuperuser && <Tag color="gold">Суперюзер</Tag>}
                </Space>
              ),
            },
            {
              label: 'Статус',
              children: (
                <Tag color={statusLabels[staff.status].color}>{statusSingular[staff.status]}</Tag>
              ),
            },
            { label: 'Посада', children: staff.position ?? '—' },
            {
              label: 'Спеціалізації',
              children: staff.specializations?.length ? (
                <Space wrap>
                  {staff.specializations.map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                </Space>
              ) : (
                '—'
              ),
            },
            {
              label: 'Телефон',
              children: staff.phone ? (
                <Typography.Text copyable>{formatPhone(staff.phone)}</Typography.Text>
              ) : (
                '—'
              ),
            },
            { label: 'Додатковий телефон', children: formatPhone(staff.additionalPhone) || '—' },
            { label: 'Email', children: staff.email ?? '—' },
            {
              label: 'Telegram',
              children: staff.telegramLinked ? (
                <Tag color="green">Підключено</Tag>
              ) : (
                'Не підключено'
              ),
            },
            { label: 'Стать', children: staff.gender ? genderLabels[staff.gender] : '—' },
            { label: 'Дата народження', children: formatDate(staff.birthDate) },
            { label: 'Адреса', children: staff.address ?? '—' },
            {
              label: 'Контактна особа',
              children:
                [staff.emergencyContactName, formatPhone(staff.emergencyContactPhone)]
                  .filter(Boolean)
                  .join(', ') || '—',
            },
            { label: 'Дата прийому', children: formatDate(staff.hireDate) },
            ...(staff.firedAt ? [{ label: 'Звільнено', children: formatDate(staff.firedAt) }] : []),
            ...(can.staff.viewFinance
              ? [
                  { label: 'Оклад', children: formatMoney(staff.salary) },
                  {
                    label: 'Комісія',
                    children: staff.commissionPercent ? `${Number(staff.commissionPercent)}%` : '—',
                  },
                ]
              : []),
          ]}
        />
      )}
    </Drawer>
  );
}
