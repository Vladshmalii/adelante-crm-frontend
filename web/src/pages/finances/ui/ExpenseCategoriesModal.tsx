import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { App, Button, Input, Modal, Popconfirm, Space, Table } from 'antd';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { QueryErrorAlert } from '@/shared/ui';

import {
  useCreateExpenseCategory,
  useDeleteExpenseCategory,
  useRenameExpenseCategory,
} from '../api/finances.mutations';
import { expenseCategoriesQueryOptions } from '../api/finances.queries';

type Category = Schema<'ExpenseCategoryOut'>;

interface ExpenseCategoriesModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Справочник категорий расходов. Переименование бекенд переносит и в проведённые расходы;
 * удалённая категория пропадает из списка, но в истории операций остаётся.
 */
export function ExpenseCategoriesModal({ open, onClose }: ExpenseCategoriesModalProps) {
  const { message } = App.useApp();
  const { data, error, isFetching, refetch } = useQuery({
    ...expenseCategoriesQueryOptions(),
    enabled: open,
  });
  const create = useCreateExpenseCategory();
  const rename = useRenameExpenseCategory();
  const remove = useDeleteExpenseCategory();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

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
      title="Категорії витрат"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnHidden
    >
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input
          placeholder="Нова категорія"
          value={newName}
          maxLength={255}
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
        scroll={{ y: 480 }}
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
                  maxLength={255}
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
                c.name
              ),
          },
          {
            title: '',
            key: 'actions',
            width: 88,
            render: (_, c) => (
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
                  description="Проведені витрати збережуть цю категорію."
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
