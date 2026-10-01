import { Button, Form, Input } from 'antd';

import { isValidPhone } from '@/shared/lib';
import { PhoneInput } from '@/shared/ui';

import { StepTitle } from './BookingShell';

export interface ClientDetails {
  name: string;
  phone: string;
  comment?: string;
}

interface DetailsStepProps {
  value: ClientDetails | null;
  onSubmit: (details: ClientDetails) => void;
}

/** Шаг 4: ім'я, телефон, коментар. По телефону салон узнаёт клиента и шлёт нагадування. */
export function DetailsStep({ value, onSubmit }: DetailsStepProps) {
  return (
    <>
      <StepTitle title="Ваші контактні дані" subtitle="Щоб салон міг підтвердити запис" />
      <Form<ClientDetails>
        layout="vertical"
        size="large"
        initialValues={value ?? undefined}
        onFinish={(v) => {
          onSubmit({
            ...v,
            name: v.name.trim(),
            comment: v.comment?.trim() ? v.comment.trim() : undefined,
          });
        }}
      >
        <Form.Item
          name="name"
          label="Ваше ім'я"
          rules={[{ required: true, whitespace: true, message: "Вкажіть ім'я" }]}
        >
          <Input placeholder="Іван Петренко" maxLength={255} autoComplete="name" />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Телефон"
          required
          rules={[
            {
              validator: (_, v?: string) =>
                v && isValidPhone(v)
                  ? Promise.resolve()
                  : Promise.reject(new Error('Вкажіть телефон у форматі +380…')),
            },
          ]}
        >
          <PhoneInput />
        </Form.Item>
        <Form.Item name="comment" label="Коментар (необов'язково)">
          <Input.TextArea rows={3} maxLength={2000} placeholder="Побажання, алергії…" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block>
          Далі
        </Button>
      </Form>
    </>
  );
}
