import { createFileRoute, Link } from '@tanstack/react-router';
import { Button, Result } from 'antd';

export const Route = createFileRoute('/_app/forbidden')({
  component: () => (
    <Result
      status="403"
      title="Немає доступу"
      subTitle="У вашої ролі немає доступу до цього розділу."
      extra={
        <Link to="/">
          <Button type="primary">На головну</Button>
        </Link>
      }
    />
  ),
});
