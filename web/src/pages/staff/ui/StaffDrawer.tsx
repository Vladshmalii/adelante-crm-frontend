import { EditOutlined } from '@ant-design/icons';
import { Button, Descriptions, Drawer, Space, Tag, Typography } from 'antd';

import type { Schema } from '@/shared/api';
import { useViewer } from '@/shared/auth';
import { formatDate, formatMoney, formatPhone, genderLabels, roleLabels } from '@/shared/lib';

import { staffFullName, statusLabels, statusSingular } from '../model/labels';

type Staff = Schema<'StaffOut'>;

interface StaffDrawerProps {
  staff: Staff | null;
  onClose: () => void;
  onEdit: (staff: Staff) => void;
}

export function StaffDrawer({ staff, onClose, onEdit }: StaffDrawerProps) {
  const { can } = useViewer();
  // Бекенд редактирует только мастеров (PATCH /staff/{id} ищет мастера салона).
  const editable = staff?.role === 'master' && can.staff.manageMasters;

  return (
    <Drawer
      open={!!staff}
      onClose={onClose}
      size="large"
      title={staff ? staffFullName(staff) : ''}
      extra={
        editable && (
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
      {staff && (
        <Descriptions
          column={1}
          bordered
          size="small"
          items={[
            { label: 'Роль', children: roleLabels[staff.role] },
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
            { label: 'Стать', children: staff.gender ? genderLabels[staff.gender] : '—' },
            { label: 'Дата народження', children: formatDate(staff.birthDate) },
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
