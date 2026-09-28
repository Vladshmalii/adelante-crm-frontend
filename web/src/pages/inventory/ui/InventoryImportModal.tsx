import { InboxOutlined } from '@ant-design/icons';
import { Alert, App, Modal, Typography, Upload } from 'antd';
import { useState } from 'react';

import { errorMessage } from '@/shared/api';

import { useImportInventory } from '../api/inventory.mutations';

/** Колонки файла по порядку — как их читает бекенд (`IMPORT_COLUMNS`). */
const COLUMNS = [
  'Назва',
  'Артикул',
  'Категорія',
  'Одиниця',
  "Об'єм упаковки",
  'Залишок',
  'Мін. залишок',
  'Собівартість',
  'Ціна продажу',
  'Опис',
];

interface InventoryImportModalProps {
  open: boolean;
  onClose: () => void;
}

export function InventoryImportModal({ open, onClose }: InventoryImportModalProps) {
  const { message } = App.useApp();
  const importProducts = useImportInventory();
  const [file, setFile] = useState<File | null>(null);
  const report = importProducts.data;

  const close = () => {
    setFile(null);
    importProducts.reset();
    onClose();
  };

  return (
    <Modal
      title="Імпорт товарів з Excel"
      open={open}
      onCancel={close}
      destroyOnHidden
      okText={report ? 'Закрити' : 'Завантажити'}
      cancelButtonProps={{ style: report ? { display: 'none' } : undefined }}
      okButtonProps={{ disabled: !report && !file, loading: importProducts.isPending }}
      onOk={() => {
        if (report) {
          close();
        } else if (file) {
          importProducts.mutate(file, {
            onError: (e) => void message.error(errorMessage(e)),
          });
        }
      }}
    >
      {report ? (
        <>
          <Alert
            type={report.errors.length ? 'warning' : 'success'}
            showIcon
            title={`Створено: ${report.created}, оновлено: ${report.updated}, помилок: ${report.errors.length}`}
          />
          {report.errors.length > 0 && (
            <Typography.Paragraph style={{ marginTop: 16, maxHeight: 240, overflow: 'auto' }}>
              <ul>
                {report.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </Typography.Paragraph>
          )}
        </>
      ) : (
        <>
          <Typography.Paragraph type="secondary">
            Перший рядок — заголовок, далі колонки по порядку: {COLUMNS.join(', ')}. Товар шукається
            за артикулом: новий створюється, наявний оновлюється, а різниця залишку проводиться
            коригуванням. Невідома категорія створюється.
          </Typography.Paragraph>
          <Upload.Dragger
            accept=".xlsx"
            maxCount={1}
            fileList={file ? [{ uid: '1', name: file.name, status: 'done' }] : []}
            beforeUpload={(f) => {
              setFile(f);
              return false;
            }}
            onRemove={() => {
              setFile(null);
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Перетягніть файл сюди або натисніть, щоб обрати</p>
            <p className="ant-upload-hint">Формат .xlsx</p>
          </Upload.Dragger>
        </>
      )}
    </Modal>
  );
}
