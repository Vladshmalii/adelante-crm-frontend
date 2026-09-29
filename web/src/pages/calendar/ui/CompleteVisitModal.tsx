import { PlusOutlined } from '@ant-design/icons';
import { App, Form, Input, Modal, Typography, Upload, type UploadFile } from 'antd';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';

import { uploadPhoto, useCompleteRecord } from '../api/calendar.mutations';

type RecordItem = Schema<'RecordOut'>;

const MAX_PHOTOS = 10;
const MAX_SIZE = 5 * 1024 * 1024;

interface CompleteVisitModalProps {
  record: RecordItem | null;
  onClose: () => void;
}

/**
 * Завершение визита: нотатки майстра и фото процедуры. После него запись «Завершено» и
 * «Не оплачено» — оплату проводит администратор отдельно.
 */
export function CompleteVisitModal({ record, onClose }: CompleteVisitModalProps) {
  const { message } = App.useApp();
  const complete = useCompleteRecord();
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<UploadFile[]>([]);
  const uploading = files.some((f) => f.status === 'uploading');

  const reset = () => {
    setNotes('');
    setFiles([]);
  };

  return (
    <Modal
      title={record ? `Завершення візиту: ${record.client.name}` : ''}
      open={!!record}
      onCancel={() => {
        reset();
        onClose();
      }}
      okText="Завершити візит"
      cancelText="Скасувати"
      okButtonProps={{ loading: complete.isPending, disabled: uploading }}
      destroyOnHidden
      onOk={() => {
        if (!record) return;
        complete.mutate(
          {
            id: record.id,
            body: {
              notes: notes.trim() || null,
              photoUrls: files.flatMap((f) => (typeof f.url === 'string' ? [f.url] : [])),
            },
          },
          {
            onSuccess: () => {
              void message.success('Візит завершено');
              reset();
              onClose();
            },
            onError: (e) => void message.error(errorMessage(e)),
          },
        );
      }}
    >
      <Form layout="vertical">
        <Form.Item label="Нотатки майстра про клієнта">
          <Input.TextArea
            rows={4}
            maxLength={2000}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
            }}
            placeholder="Що робили, що врахувати наступного разу"
          />
        </Form.Item>
        <Form.Item label={`Фото процедури (до ${MAX_PHOTOS}, до 5 МБ)`}>
          <Upload
            listType="picture-card"
            accept="image/*"
            fileList={files}
            maxCount={MAX_PHOTOS}
            beforeUpload={(file) => {
              if (file.size > MAX_SIZE) {
                void message.error(`${file.name}: більше 5 МБ`);
                return Upload.LIST_IGNORE;
              }
              return true;
            }}
            customRequest={({ file, onSuccess, onError }) => {
              uploadPhoto(file as File).then(
                (url) => {
                  setFiles((prev) =>
                    prev.map((f) =>
                      f.uid === (file as UploadFile).uid ? { ...f, url, status: 'done' } : f,
                    ),
                  );
                  onSuccess?.(url);
                },
                (e: unknown) => {
                  void message.error(errorMessage(e));
                  onError?.(e as Error);
                },
              );
            }}
            onChange={({ fileList }) => {
              // url проставляем сами после загрузки — сохраняем его при обновлениях списка.
              setFiles((prev) =>
                fileList.map((f) => ({
                  ...f,
                  url: f.url ?? prev.find((p) => p.uid === f.uid)?.url,
                })),
              );
            }}
          >
            {files.length < MAX_PHOTOS && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Фото</div>
              </div>
            )}
          </Upload>
        </Form.Item>
      </Form>
      <Typography.Text type="secondary">
        Після завершення запис стане «Не оплачено» — оплату проводить адміністратор.
      </Typography.Text>
    </Modal>
  );
}
