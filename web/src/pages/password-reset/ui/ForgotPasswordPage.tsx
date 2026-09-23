import { MailOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { Link } from '@tanstack/react-router';
import { Alert, Button, Flex, Result } from 'antd';

import { errorMessage } from '@/shared/api';

import { useForgotPassword } from '../api/password.mutations';

export function ForgotPasswordPage({ email }: { email?: string }) {
  const forgot = useForgotPassword();

  if (forgot.isSuccess) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100%' }}>
        <Result
          status="success"
          title="Перевірте пошту"
          subTitle="Якщо такий email є в системі, ми надіслали посилання для зміни пароля. Воно діє 1 годину."
          extra={
            <Link to="/login">
              <Button type="primary">Повернутися до входу</Button>
            </Link>
          }
        />
      </Flex>
    );
  }

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100%' }}>
      <LoginForm<{ email: string }>
        logo="/favicon.svg"
        title="Відновлення пароля"
        subTitle="Надішлемо посилання для зміни пароля на вашу пошту"
        initialValues={{ email }}
        submitter={{ searchConfig: { submitText: 'Надіслати посилання' } }}
        loading={forgot.isPending}
        onFinish={async ({ email: value }) => {
          await forgot.mutateAsync(value).catch(() => undefined);
        }}
        message={
          forgot.isError && (
            <Alert
              type="error"
              showIcon
              title={errorMessage(forgot.error)}
              style={{ marginBottom: 24 }}
            />
          )
        }
      >
        <ProFormText
          name="email"
          fieldProps={{ size: 'large', prefix: <MailOutlined />, autoComplete: 'email' }}
          placeholder="Email"
          rules={[
            { required: true, message: 'Вкажіть email' },
            { type: 'email', message: 'Невірний формат email' },
          ]}
        />
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Link to="/login">Повернутися до входу</Link>
        </div>
      </LoginForm>
    </Flex>
  );
}
