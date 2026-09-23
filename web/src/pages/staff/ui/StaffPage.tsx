import { MoreOutlined, PlusOutlined } from '@ant-design/icons';
import {
  PageContainer,
  type ProColumns,
  ProTable,
  StatisticCard,
} from '@ant-design/pro-components';
import { useQueries, useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { App, Button, Dropdown, type MenuProps, Select, Space, Tag, Typography } from 'antd';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { useViewer } from '@/shared/auth';
import { formatDate, formatMoney, formatPhone, roleLabels, toOptions } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import { useFireStaff } from '../api/staff.mutations';
import { staffCountQueryOptions, staffListQueryOptions } from '../api/staff.queries';
import { staffFullName, statusLabels } from '../model/labels';
import type { StaffSearch } from '../model/search';
import { StaffDrawer } from './StaffDrawer';
import { StaffFormModal } from './StaffFormModal';
import { StaffScheduleModal } from './StaffScheduleModal';
import { StaffStatsModal } from './StaffStatsModal';

type Staff = Schema<'StaffOut'>;
type Status = Schema<'StaffStatus'>;

const route = getRouteApi('/_app/staff');
const STATUSES = Object.keys(statusLabels) as Status[];

export function StaffPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const { message, modal } = App.useApp();
  const { can } = useViewer();
  const { data, error, isFetching, refetch } = useQuery(staffListQueryOptions(search));
  const counts = useQueries({ queries: STATUSES.map((s) => staffCountQueryOptions(s)) });
  const fire = useFireStaff();

  const [form, setForm] = useState<{ staff?: Staff } | null>(null);
  const [viewed, setViewed] = useState<Staff | null>(null);
  const [scheduleFor, setScheduleFor] = useState<Staff | null>(null);
  const [statsFor, setStatsFor] = useState<Staff | null>(null);

  const setSearch = (patch: Partial<StaffSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const confirmFire = (staff: Staff) => {
    modal.confirm({
      title: `Звільнити ${staffFullName(staff)}?`,
      content:
        'Співробітник зникне з розкладу. Якщо в нього є майбутні записи, звільнити не вийде.',
      okText: 'Звільнити',
      okButtonProps: { danger: true },
      cancelText: 'Скасувати',
      onOk: () =>
        fire.mutateAsync(staff.id).then(
          () => void message.success('Співробітника звільнено'),
          (e: unknown) => void message.error(errorMessage(e)),
        ),
    });
  };

  // Бекенд позволяет редактировать, увольнять и вести график только мастеров.
  const rowActions = (staff: Staff): MenuProps['items'] =>
    staff.role !== 'master' || !can.staff.manageMasters
      ? []
      : [
          {
            key: 'edit',
            label: 'Редагувати',
            onClick: () => {
              setForm({ staff });
            },
          },
          {
            key: 'schedule',
            label: 'Графік роботи',
            onClick: () => {
              setScheduleFor(staff);
            },
          },
          ...(can.staff.viewFinance
            ? [
                {
                  key: 'stats',
                  label: 'Статистика',
                  onClick: () => {
                    setStatsFor(staff);
                  },
                },
              ]
            : []),
          ...(staff.status !== 'fired'
            ? [
                { type: 'divider' as const },
                {
                  key: 'fire',
                  label: 'Звільнити',
                  danger: true,
                  onClick: () => {
                    confirmFire(staff);
                  },
                },
              ]
            : []),
        ];

  const columns: ProColumns<Staff>[] = [
    {
      title: 'Співробітник',
      key: 'name',
      render: (_, s) => (
        <Typography.Link
          onClick={() => {
            setViewed(s);
          }}
        >
          {staffFullName(s)}
        </Typography.Link>
      ),
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      render: (_, s) => (
        <Tag color={s.role === 'administrator' ? 'purple' : 'default'}>{roleLabels[s.role]}</Tag>
      ),
    },
    { title: 'Посада', dataIndex: 'position', ellipsis: true },
    {
      title: 'Спеціалізації',
      key: 'specializations',
      render: (_, s) =>
        s.specializations?.length ? (
          <Space size={[0, 4]} wrap>
            {s.specializations.map((x) => (
              <Tag key={x}>{x}</Tag>
            ))}
          </Space>
        ) : (
          '—'
        ),
    },
    { title: 'Телефон', key: 'phone', render: (_, s) => formatPhone(s.phone) || '—' },
    { title: 'Email', dataIndex: 'email', ellipsis: true },
    { title: 'Дата прийому', key: 'hireDate', render: (_, s) => formatDate(s.hireDate) },
    ...(can.staff.viewFinance
      ? ([
          {
            title: 'Оклад',
            key: 'salary',
            align: 'right',
            render: (_, s) => formatMoney(s.salary),
          },
          {
            title: 'Комісія',
            key: 'commission',
            align: 'right',
            render: (_, s) => (s.commissionPercent ? `${Number(s.commissionPercent)}%` : '—'),
          },
        ] satisfies ProColumns<Staff>[])
      : []),
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_, s) => {
        const items = rowActions(s);
        return items?.length ? (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button type="text" aria-label="Дії" icon={<MoreOutlined />} />
          </Dropdown>
        ) : null;
      },
    },
  ];

  return (
    <PageContainer title="Співробітники">
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <StatisticCard.Group direction="row" style={{ marginBottom: 16 }}>
        {STATUSES.map((status, i) => (
          <StatisticCard
            key={status}
            statistic={{ title: statusLabels[status].text, value: counts[i]?.data ?? '—' }}
          />
        ))}
      </StatisticCard.Group>

      <ProTable<Staff>
        rowKey="id"
        columns={columns}
        dataSource={data?.data}
        loading={isFetching}
        search={false}
        columnEmptyText="—"
        scroll={{ x: 'max-content' }}
        options={{ reload: () => void refetch(), density: true, setting: true }}
        onRow={(s) => ({
          onDoubleClick: () => {
            setViewed(s);
          },
        })}
        pagination={{
          current: search.page,
          pageSize: search.perPage,
          total: data?.meta?.total,
          pageSizeOptions: [25, 50, 100],
          showSizeChanger: true,
          onChange: (page, perPage) => void setSearch({ page, perPage }),
        }}
        toolbar={{
          menu: {
            type: 'tab',
            activeKey: search.status,
            items: STATUSES.map((key) => ({ key, label: statusLabels[key].text })),
            onChange: (key) => void setSearch({ status: key as Status, page: 1 }),
          },
          search: {
            placeholder: "Ім'я, телефон",
            allowClear: true,
            defaultValue: search.query,
            onSearch: (query: string) => void setSearch({ query: query || undefined, page: 1 }),
          },
          actions: [
            <Select
              key="role"
              allowClear
              placeholder="Усі ролі"
              style={{ width: 160 }}
              value={search.role}
              onChange={(role?: StaffSearch['role']) => void setSearch({ role, page: 1 })}
              options={toOptions(roleLabels)}
            />,
            can.staff.manageMasters && (
              <Button
                key="create"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setForm({});
                }}
              >
                Додати співробітника
              </Button>
            ),
          ],
        }}
      />

      <StaffDrawer
        staff={viewed}
        onClose={() => {
          setViewed(null);
        }}
        onEdit={(staff) => {
          setViewed(null);
          setForm({ staff });
        }}
      />
      <StaffFormModal
        open={form !== null}
        staff={form?.staff}
        onOpenChange={(open) => {
          if (!open) setForm(null);
        }}
      />
      <StaffScheduleModal
        staff={scheduleFor}
        onClose={() => {
          setScheduleFor(null);
        }}
      />
      <StaffStatsModal
        staff={statsFor}
        onClose={() => {
          setStatsFor(null);
        }}
      />
    </PageContainer>
  );
}
