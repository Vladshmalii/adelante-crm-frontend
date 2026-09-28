import { InboxOutlined } from '@ant-design/icons';
import { Alert, App, Modal, Typography, Upload } from 'antd';
import { useState } from 'react';

import { errorMessage } from '@/shared/api';

import { useImportClients } from '../api/clients.mutations';

interface ClientImportModalProps {
  open: boolean;
  onClose: () => void;
}

export function ClientImportModal({ open, onClose }: ClientImportModalProps) {
  const { message } = App.useApp();
  const importClients = useImportClients();
  const [file, setFile] = useState<File | null>(null);
  const report = importClients.data;

  const close = () => {
    setFile(null);
    importClients.reset();
    onClose();
  };

  return (
    <Modal
      title="Імпорт клієнтів з Excel"
      open={open}
      onCancel={close}
      destroyOnHidden
      okText={report ? 'Закрити' : 'Завантажити'}
      cancelButtonProps={{ style: report ? { display: 'none' } : undefined }}
      okButtonProps={{ disabled: !report && !file, loading: importClients.isPending }}
      onOk={() => {
        if (report) {
          close();
        } else if (file) {
          importClients.mutate(file, {
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
        <Upload.Dragger
          accept=".xlsx,.xls"
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
          <p className="ant-upload-hint">Формати .xlsx, .xls</p>
        </Upload.Dragger>
      )}
    </Modal>
  );
}
