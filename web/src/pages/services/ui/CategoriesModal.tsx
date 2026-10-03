import { DeleteOutlined, EditOutlined, LockOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { App, Button, Input, Modal, Popconfirm, Space, Table, Tooltip } from 'antd';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { QueryErrorAlert } from '@/shared/ui';

import {
  useCreateServiceCategory,
  useDeleteServiceCategory,
  useRenameServiceCategory,
} from '../api/services.mutations';
import { serviceCategoriesQueryOptions } from '../api/services.queries';

type Category = Schema<'app__api__admin__services__CategoryOut'>;

interface CategoriesModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Категории услуг. Системная «Інше» не переименовывается и не удаляется; услуги удалённой
 * категории переходят в неё. Порядок (по алфавиту, «Інше» последней) задаёт бекенд.
 */
export function CategoriesModal({ open, onClose }: CategoriesModalProps) {
  const { message } = App.useApp();
  const { data, error, isFetching, refetch } = useQuery({
    ...serviceCategoriesQueryOptions(),
    enabled: open,
  });
  const create = useCreateServiceCategory();
  const rename = useRenameServiceCategory();
  const remove = useDeleteServiceCategory();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const fallback = data?.find((c) => c.isSystem)?.name ?? 'Інше';

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    create.mutate(name, {
      onSuccess: () => {
        setNewName('');
        void message.success('Категорію додано');
      },
      onError: (e) => void message.error(errorMessage(e)),
    });
  };

  const saveRename = () => {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) return;
    rename.mutate(
      { id: editing.id, name },
      {
        onSuccess: () => {
          setEditing(null);
          void message.success('Категорію перейменовано');
        },
        onError: (e) => void message.error(errorMessage(e)),
      },
    );
  };

  return (
    <Modal
      title="Категорії послуг"
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      destroyOnHidden
    >
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input
          placeholder="Нова категорія"
          value={newName}
          maxLength={128}
          onChange={(e) => {
            setNewName(e.target.value);
          }}
          onPressEnter={add}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          loading={create.isPending}
          disabled={!newName.trim()}
          onClick={add}
        >
          Додати
        </Button>
      </Space.Compact>
      <Table<Category>
        rowKey="id"
        size="small"
        pagination={false}
        loading={isFetching}
        dataSource={data}
        columns={[
          {
            title: 'Назва',
            key: 'name',
            render: (_, c) =>
              editing?.id === c.id ? (
                <Input
                  autoFocus
                  size="small"
                  value={editing.name}
                  maxLength={128}
                  onChange={(e) => {
                    setEditing({ id: c.id, name: e.target.value });
                  }}
                  onPressEnter={saveRename}
                  onBlur={() => {
                    setEditing(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setEditing(null);
                  }}
                />
              ) : (
                <Space>
                  {c.name}
                  {c.isSystem && (
                    <Tooltip title="Системна категорія">
                      <LockOutlined />
                    </Tooltip>
                  )}
                </Space>
              ),
          },
          { title: 'Послуг', dataIndex: 'servicesCount', align: 'right', width: 90 },
          {
            title: '',
            key: 'actions',
            width: 88,
            render: (_, c) =>
              !c.isSystem && (
                <Space size={0}>
                  <Button
                    type="text"
                    size="small"
                    aria-label="Перейменувати"
                    icon={<EditOutlined />}
                    onMouseDown={(e) => {
                      // Не даём полю ввода соседней строки потерять фокус раньше клика.
                      e.preventDefault();
                    }}
                    onClick={() => {
                      setEditing({ id: c.id, name: c.name });
                    }}
                  />
                  <Popconfirm
                    title={`Видалити категорію «${c.name}»?`}
                    description={
                      c.servicesCount > 0
                        ? `Послуги (${c.servicesCount}) перейдуть в «${fallback}».`
                        : 'Категорія порожня.'
                    }
                    okText="Видалити"
                    okButtonProps={{ danger: true }}
                    cancelText="Скасувати"
                    onConfirm={() =>
                      remove.mutateAsync(c.id).then(
                        () => void message.success('Категорію видалено'),
                        (e: unknown) => void message.error(errorMessage(e)),
                      )
                    }
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      aria-label="Видалити"
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>
                </Space>
              ),
          },
        ]}
      />
    </Modal>
  );
}
